/**
 * HyperClick Pro 2026 - C# Win32 Native Worker Source
 * Compiled into a native background worker process using standard Windows csc.exe.
 * P/Invokes Win32 SendInput, mouse_event, QueryPerformanceCounter, timeBeginPeriod.
 */

export const CS_WORKER_SOURCE = `
using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace HyperClick.Native
{
    public class Program
    {
        #region Win32 API Imports

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint SendInput(uint nInputs, [MarshalAs(UnmanagedType.LPArray), In] INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetCursorPos(int X, int Y);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        private static extern IntPtr GetDC(IntPtr hwnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hwnd, IntPtr hdc);

        [DllImport("gdi32.dll")]
        private static extern uint GetPixel(IntPtr hdc, int nXPos, int nYPos);

        [DllImport("winmm.dll", EntryPoint = "timeBeginPeriod")]
        private static extern uint TimeBeginPeriod(uint uMilliseconds);

        [DllImport("winmm.dll", EntryPoint = "timeEndPeriod")]
        private static extern uint TimeEndPeriod(uint uMilliseconds);

        [DllImport("kernel32.dll")]
        private static extern bool QueryPerformanceCounter(out long lpPerformanceCount);

        [DllImport("kernel32.dll")]
        private static extern bool QueryPerformanceFrequency(out long lpFrequency);

        #endregion

        #region Win32 Constants & Structs

        private const int INPUT_MOUSE = 0;

        private const uint MOUSEEVENTF_MOVE = 0x0001;
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
        private const uint MOUSEEVENTF_ABSOLUTE = 0x8000;

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X;
            public int Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public UIntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public UIntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct HARDWAREINPUT
        {
            public uint uMsg;
            public ushort wParamL;
            public ushort wParamH;
        }

        [StructLayout(LayoutKind.Explicit)]
        public struct INPUTUNION
        {
            [FieldOffset(0)]
            public MOUSEINPUT mi;
            [FieldOffset(0)]
            public KEYBDINPUT ki;
            [FieldOffset(0)]
            public HARDWAREINPUT hi;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct INPUT
        {
            public int type;
            public INPUTUNION u;
        }

        #endregion

        private static readonly int INPUT_SIZE = Marshal.SizeOf(typeof(INPUT));
        private static long _frequency = 0;
        private static volatile bool _autoLoopRunning = false;
        private static Thread _autoLoopThread = null;
        private static readonly object _loopLock = new object();
        private static readonly Random _rng = new Random();

        // Pre-allocated static reusable INPUT structures to eliminate managed GC heap allocations
        private static readonly INPUT[] _leftDownInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_LEFTDOWN) };
        private static readonly INPUT[] _leftUpInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_LEFTUP) };
        private static readonly INPUT[] _rightDownInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_RIGHTDOWN) };
        private static readonly INPUT[] _rightUpInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_RIGHTUP) };
        private static readonly INPUT[] _middleDownInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_MIDDLEDOWN) };
        private static readonly INPUT[] _middleUpInputs = new INPUT[1] { CreateMouseInput(MOUSEEVENTF_MIDDLEUP) };

        // Pre-allocated atomic single-call click inputs (Down + Up in one SendInput call for max throughput)
        private static readonly INPUT[] _leftClickAtomic = new INPUT[2] { CreateMouseInput(MOUSEEVENTF_LEFTDOWN), CreateMouseInput(MOUSEEVENTF_LEFTUP) };
        private static readonly INPUT[] _rightClickAtomic = new INPUT[2] { CreateMouseInput(MOUSEEVENTF_RIGHTDOWN), CreateMouseInput(MOUSEEVENTF_RIGHTUP) };
        private static readonly INPUT[] _middleClickAtomic = new INPUT[2] { CreateMouseInput(MOUSEEVENTF_MIDDLEDOWN), CreateMouseInput(MOUSEEVENTF_MIDDLEUP) };

        private static INPUT CreateMouseInput(uint flags)
        {
            INPUT input = new INPUT();
            input.type = INPUT_MOUSE;
            input.u.mi.dwFlags = flags;
            input.u.mi.dx = 0;
            input.u.mi.dy = 0;
            input.u.mi.mouseData = 0;
            input.u.mi.time = 0;
            input.u.mi.dwExtraInfo = UIntPtr.Zero;
            return input;
        }

        public static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            QueryPerformanceFrequency(out _frequency);
            if (_frequency <= 0) _frequency = 10000000;

            TimeBeginPeriod(1); // Set 1ms OS timer resolution

            Console.WriteLine("READY");

            string line;
            while ((line = Console.ReadLine()) != null)
            {
                line = line.Trim();
                if (string.IsNullOrEmpty(line)) continue;

                try
                {
                    HandleCommand(line);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERR " + ex.Message);
                }
            }

            StopAutonomousLoop();
            TimeEndPeriod(1);
        }

        private static void HandleCommand(string line)
        {
            string[] parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return;

            string cmd = parts[0].ToUpperInvariant();

            switch (cmd)
            {
                case "PING":
                    Console.WriteLine("PONG");
                    break;

                case "GETPOS":
                    POINT pt;
                    GetCursorPos(out pt);
                    Console.WriteLine(string.Format("POS {0} {1}", pt.X, pt.Y));
                    break;

                case "GETPIXEL":
                    int px = 0, py = 0;
                    if (parts.Length >= 3)
                    {
                        int.TryParse(parts[1], out px);
                        int.TryParse(parts[2], out py);
                    }
                    IntPtr hdc = GetDC(IntPtr.Zero);
                    if (hdc != IntPtr.Zero)
                    {
                        try
                        {
                            uint colorRef = GetPixel(hdc, px, py);
                            byte r = (byte)(colorRef & 0x000000FF);
                            byte g = (byte)((colorRef & 0x0000FF00) >> 8);
                            byte b = (byte)((colorRef & 0x00FF0000) >> 16);
                            Console.WriteLine(string.Format("COLOR #{0:X2}{1:X2}{2:X2}", r, g, b));
                        }
                        finally
                        {
                            ReleaseDC(IntPtr.Zero, hdc);
                        }
                    }
                    else
                    {
                        Console.WriteLine("COLOR #000000");
                    }
                    break;

                case "MOVE":
                    int mx = 0, my = 0;
                    if (parts.Length >= 3)
                    {
                        int.TryParse(parts[1], out mx);
                        int.TryParse(parts[2], out my);
                    }
                    SetCursorPos(mx, my);
                    Console.WriteLine("OK");
                    break;

                case "DOWN":
                    // DOWN <btn:0=left,1=right,2=middle> [x] [y]
                    int dBtn = 0;
                    if (parts.Length >= 2) int.TryParse(parts[1], out dBtn);
                    if (parts.Length >= 4 && parts[2] != "-" && parts[3] != "-")
                    {
                        int dx, dy;
                        if (int.TryParse(parts[2], out dx) && int.TryParse(parts[3], out dy))
                        {
                            SetCursorPos(dx, dy);
                        }
                    }
                    SendButtonDown(dBtn);
                    Console.WriteLine("OK");
                    break;

                case "UP":
                    // UP <btn:0=left,1=right,2=middle> [x] [y]
                    int uBtn = 0;
                    if (parts.Length >= 2) int.TryParse(parts[1], out uBtn);
                    if (parts.Length >= 4 && parts[2] != "-" && parts[3] != "-")
                    {
                        int ux, uy;
                        if (int.TryParse(parts[2], out ux) && int.TryParse(parts[3], out uy))
                        {
                            SetCursorPos(ux, uy);
                        }
                    }
                    SendButtonUp(uBtn);
                    Console.WriteLine("OK");
                    break;

                case "CLICK":
                    // CLICK <btn> [x] [y] [count] [holdMicroseconds]
                    int cBtn = 0;
                    if (parts.Length >= 2) int.TryParse(parts[1], out cBtn);
                    if (parts.Length >= 4 && parts[2] != "-" && parts[3] != "-")
                    {
                        int cx, cy;
                        if (int.TryParse(parts[2], out cx) && int.TryParse(parts[3], out cy))
                        {
                            SetCursorPos(cx, cy);
                        }
                    }
                    int count = 1;
                    if (parts.Length >= 5) int.TryParse(parts[4], out count);
                    count = Math.Max(1, count);

                    int holdUs = 800;
                    if (parts.Length >= 6) int.TryParse(parts[5], out holdUs);
                    holdUs = Math.Max(50, holdUs);

                    for (int i = 0; i < count; i++)
                    {
                        SendButtonDown(cBtn);
                        MicroSleep(holdUs);
                        SendButtonUp(cBtn);
                        if (i < count - 1) MicroSleep(1200);
                    }
                    Console.WriteLine("OK");
                    break;

                case "START_AUTOLOOP":
                    // START_AUTOLOOP <btn> <x> <y> <intervalUs> <maxClicks> <jitterRadius>
                    int aBtn = 0, aX = -1, aY = -1, jitter = 0;
                    long intervalUs = 1000, maxClicks = 0;

                    if (parts.Length >= 2) int.TryParse(parts[1], out aBtn);
                    if (parts.Length >= 3) int.TryParse(parts[2], out aX);
                    if (parts.Length >= 4) int.TryParse(parts[3], out aY);
                    if (parts.Length >= 5) long.TryParse(parts[4], out intervalUs);
                    if (parts.Length >= 6) long.TryParse(parts[5], out maxClicks);
                    if (parts.Length >= 7) int.TryParse(parts[6], out jitter);

                    StartAutonomousLoop(aBtn, aX, aY, Math.Max(1, intervalUs), maxClicks, jitter);
                    Console.WriteLine("OK");
                    break;

                case "STOP":
                case "KILL":
                case "STOP_AUTOLOOP":
                    StopAutonomousLoop();
                    Console.WriteLine("OK");
                    break;

                case "EXIT":
                    StopAutonomousLoop();
                    TimeEndPeriod(1);
                    Environment.Exit(0);
                    break;

                default:
                    Console.WriteLine("UNKNOWN_CMD");
                    break;
            }
        }

        private static void SendButtonDown(int btn)
        {
            INPUT[] inputs = btn == 1 ? _rightDownInputs : (btn == 2 ? _middleDownInputs : _leftDownInputs);
            SendInput(1, inputs, INPUT_SIZE);
        }

        private static void SendButtonUp(int btn)
        {
            INPUT[] inputs = btn == 1 ? _rightUpInputs : (btn == 2 ? _middleUpInputs : _leftUpInputs);
            SendInput(1, inputs, INPUT_SIZE);
        }

        private static void SendAtomicClick(int btn)
        {
            INPUT[] inputs = btn == 1 ? _rightClickAtomic : (btn == 2 ? _middleClickAtomic : _leftClickAtomic);
            SendInput(2, inputs, INPUT_SIZE);
        }

        private static void StartAutonomousLoop(int btn, int x, int y, long intervalUs, long maxClicks, int jitterRadius)
        {
            lock (_loopLock)
            {
                StopAutonomousLoop();

                _autoLoopRunning = true;
                _autoLoopThread = new Thread(() =>
                {
                    long performed = 0;
                    long startTicks;
                    QueryPerformanceCounter(out startTicks);
                    long nextTicks = startTicks;
                    long ticksPerMicro = Math.Max(1, _frequency / 1000000);
                    long intervalTicks = Math.Max(1, intervalUs * ticksPerMicro);
                    
                    // For ultra-fast rates (> 1000 CPS, interval < 1000us), use sub-micro hold or atomic click
                    bool isUltraHighFreq = intervalUs < 1000;
                    long holdTicks = isUltraHighFreq
                        ? Math.Max(1, Math.Min(ticksPerMicro * 100, intervalTicks / 4))
                        : Math.Max(ticksPerMicro * 50, Math.Min(ticksPerMicro * 1500, intervalTicks / 3));

                    long lastReportTicks = startTicks;
                    long reportIntervalTicks = _frequency / 30; // 30Hz status reports

                    bool useFixedPos = (x >= 0 && y >= 0);

                    try
                    {
                        while (_autoLoopRunning && (maxClicks <= 0 || performed < maxClicks))
                        {
                            if (useFixedPos)
                            {
                                if (jitterRadius > 0)
                                {
                                    int jx = x + _rng.Next(-jitterRadius, jitterRadius + 1);
                                    int jy = y + _rng.Next(-jitterRadius, jitterRadius + 1);
                                    SetCursorPos(jx, jy);
                                }
                                else
                                {
                                    SetCursorPos(x, y);
                                }
                            }

                            if (isUltraHighFreq && holdTicks <= 5 * ticksPerMicro)
                            {
                                // Single atomic SendInput (Down + Up)
                                SendAtomicClick(btn);
                            }
                            else
                            {
                                // Click Down
                                SendButtonDown(btn);

                                // Micro hold
                                long downTicks;
                                QueryPerformanceCounter(out downTicks);
                                long targetUpTicks = downTicks + holdTicks;
                                while (_autoLoopRunning)
                                {
                                    long cur;
                                    QueryPerformanceCounter(out cur);
                                    if (cur >= targetUpTicks) break;
                                    Thread.SpinWait(10);
                                }

                                // Click Up
                                SendButtonUp(btn);
                            }

                            performed++;

                            // Schedule next click
                            nextTicks += intervalTicks;
                            long curTicks;
                            QueryPerformanceCounter(out curTicks);

                            // If behind by more than 2 intervals, reset nextTicks to avoid runaway bursts
                            if (curTicks > nextTicks + (intervalTicks * 2))
                            {
                                nextTicks = curTicks + intervalTicks;
                            }

                            // Report progress periodically (at ~30Hz)
                            if (curTicks - lastReportTicks >= reportIntervalTicks)
                            {
                                double elapsedSec = (double)(curTicks - startTicks) / _frequency;
                                double cps = elapsedSec > 0 ? (performed / elapsedSec) : 0;
                                Console.WriteLine(string.Format("PROGRESS {0} {1:F1}", performed, cps));
                                lastReportTicks = curTicks;
                            }

                            // High-precision adaptive wait for next click deadline
                            while (_autoLoopRunning)
                            {
                                QueryPerformanceCounter(out curTicks);
                                long remainingTicks = nextTicks - curTicks;
                                if (remainingTicks <= 0) break;

                                long remainingMs = (remainingTicks * 1000) / _frequency;
                                if (remainingMs > 4)
                                {
                                    int sleepSlice = (int)Math.Min(20, remainingMs - 2);
                                    Thread.Sleep(Math.Max(1, sleepSlice));
                                }
                                else if (remainingMs > 1)
                                {
                                    Thread.Sleep(1);
                                }
                                else
                                {
                                    Thread.SpinWait(20);
                                }
                            }
                        }
                    }
                    catch (ThreadInterruptedException)
                    {
                        // Expected clean interrupt on stop
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("ERR " + ex.Message);
                    }
                    finally
                    {
                        _autoLoopRunning = false;
                        // Safety release on loop termination
                        SendButtonUp(btn);
                    }

                    long endTicks;
                    QueryPerformanceCounter(out endTicks);
                    double totalSec = (double)(endTicks - startTicks) / _frequency;
                    double finalCps = totalSec > 0 ? (performed / totalSec) : 0;
                    Console.WriteLine(string.Format("COMPLETED {0} {1:F1}", performed, finalCps));
                })
                {
                    IsBackground = true,
                    Priority = ThreadPriority.Highest
                };

                _autoLoopThread.Start();
            }
        }

        private static void StopAutonomousLoop()
        {
            lock (_loopLock)
            {
                _autoLoopRunning = false;
                if (_autoLoopThread != null && _autoLoopThread.IsAlive)
                {
                    try
                    {
                        _autoLoopThread.Interrupt();
                    }
                    catch { }

                    if (!_autoLoopThread.Join(150))
                    {
                        try
                        {
                            _autoLoopThread.Abort();
                        }
                        catch { }
                    }
                    _autoLoopThread = null;
                }

                // Immediate safety release of all mouse buttons
                SendButtonUp(0);
                SendButtonUp(1);
                SendButtonUp(2);
            }
        }

        private static void MicroSleep(long microseconds)
        {
            if (microseconds <= 0) return;
            long start;
            QueryPerformanceCounter(out start);
            long ticksPerMicro = Math.Max(1, _frequency / 1000000);
            long targetTicks = start + (microseconds * ticksPerMicro);

            while (true)
            {
                long current;
                QueryPerformanceCounter(out current);
                long remainingTicks = targetTicks - current;
                if (remainingTicks <= 0) break;

                long remainingMs = (remainingTicks * 1000) / _frequency;
                if (remainingMs > 4)
                {
                    int sleepSlice = (int)Math.Min(20, remainingMs - 2);
                    Thread.Sleep(Math.Max(1, sleepSlice));
                }
                else if (remainingMs > 1)
                {
                    Thread.Sleep(1);
                }
                else
                {
                    Thread.SpinWait(20);
                }
            }
        }
    }
}
`;
