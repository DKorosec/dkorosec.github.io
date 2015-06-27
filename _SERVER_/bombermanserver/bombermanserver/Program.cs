using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Fleck;
using System.Threading;
using System.Web.Helpers;

namespace bombermanserver
{
    class Program
    {
        static string jsonRequest(int H, int K, bool R, double X, double Y, int PID)
        {
            return "{\"H\":"+H+",\"M\":[],\"P\":[],\"K\":"+K+",\"R\":"+(R?"true":"false")+",\"X\":"+X+",\"Y\":"+Y+",\"PID\":"+PID+"}";
        }
        static List<IWebSocketConnection>Clients = new List<IWebSocketConnection>();
        static string StartGameJson = "";
        static int NUMBER_OF_PLAYERS = 4;
        static bool SentGameRequest = false;
        static bool GameRunning = false;
        static bool firstRun = true;

        static void INIT_SERVER()
        {
            Clients = new List<IWebSocketConnection>();
            StartGameJson = "";
            SentGameRequest = false;
            GameRunning = false;
            firstRun = true;
        }

        static void Main(string[] args)
        {
            bool restart = false;
            Console.Write("Enter server port: ");
            string port = Console.ReadLine();
            Console.Write("Enter number of players(2-4): ");
            string strNum = Console.ReadLine();
            int num = Convert.ToInt32(strNum);
            if (num < 2 || num > 4)
                num = 4;
            NUMBER_OF_PLAYERS = num;
            while (true)
            {
                INIT_SERVER();
                restart = false;
                var server = new WebSocketServer("ws://0.0.0.0:" + port);
                server.ListenerSocket.NoDelay = true;
                //Naredi O(1) READY ARRAY KO SPREJEMEJO MAPO POSLJEJO NAZAJ READY IN KO JE VSE READY TE ZACNI ZAZNAVAT TIPKE :)
                server.Start(socket =>
                {
                    socket.OnOpen = () =>
                    {
                        if (Clients.Count == NUMBER_OF_PLAYERS)
                        {
                            socket.Close();
                            Console.WriteLine("Client denied, server full!!");
                            return;
                        }
                        Clients.Add(socket);
                        Console.WriteLine("Client connected!");
                        socket.Send(
                            jsonRequest(1, NUMBER_OF_PLAYERS, true, 0, 0, Clients.Count - 1) //SETAJ ID //H=1   in Number of players kot KEY poslji!
                        );
                    };
                    socket.OnClose = () =>
                    {
                        if (!Clients.Contains(socket)) //ne obdelaj nic, ta socket je ocitno bil zavrzen ker je server pun.
                            return;
                        Clients.Remove(socket);
                        restart = true;
                        Console.WriteLine("Client disconnected!");
                    };
                    socket.OnMessage = message =>
                    {
                        if (Clients.Count == 0)
                            return;
                        else if( !Clients.Contains(socket))
                        {
                            Console.WriteLine("Closed anonymous socket!");
                            socket.Close();
                        }
                        dynamic Respond = Json.Decode(message);
                        // Console.WriteLine(Respond.H);
                        if (Clients.First() == socket)
                        {
                            if (Respond.H == 2) //Podatki o igri!
                            {
                                StartGameJson = message;
                                return;
                            }
                            if (Respond.H == 1111) //Game koncan!
                            {
                                Console.WriteLine("Game over!");
                                BroadCast(jsonRequest(4, -1, true, 0, 0, 30)); //Ultra reset!
                                return;
                            }
                            if (Respond.H == 1000) //Game se tece!
                            {
                                Console.WriteLine("Game running!");
                                firstRun = false;
                                return;
                            }
                            if (Respond.H == 1001)
                            {
                                Console.WriteLine("Game is in waiting.");
                                if (firstRun)
                                    return;
                                StartGameJson = "";
                                SentGameRequest = false;
                                GameRunning = false;
                                return;
                            }
                        }
                        if (StartGameJson != "" && GameRunning && Respond.H == 3)
                        {
                            BroadCast(message);
                        }
                    };
                });
                System.Timers.Timer ServerChecker = new System.Timers.Timer(3000);
                ServerChecker.Elapsed += (obj, e) =>
                {
                    if (Clients.Count != 0)
                    {
                        //TO je blo prvotno misleno za enega samo... Clients.first.send...
                        BroadCast(jsonRequest(4, 0, true, Clients.Count, NUMBER_OF_PLAYERS, 20)); //Zahtevaj stanje na serveru :) POSLJI INFORMACIJO KOLKO CLIENTOV OD KOLKIH JE GOR!
                    }
                };
                ServerChecker.Enabled = true;

                while (!restart)
                {

                    if (Clients.Count == NUMBER_OF_PLAYERS && !GameRunning)
                    {
                        if (SentGameRequest && StartGameJson != "")
                        {
                            BroadCast(StartGameJson); //H = 2
                            GameRunning = true;
                        }
                        else if (!SentGameRequest)
                        {
                            SentGameRequest = true;
                            Clients.First().Send(
                                jsonRequest(0, -1, true, 0, 0, 0) //REQUESTAJ MAPO IN SETAJ ID //H=0
                            );
                        }
                    }
                    Console.WriteLine("Clients #:" + Clients.Count.ToString());
                    Thread.Sleep(1000);
                }
               

                for (int i = 0; i < Clients.Count; i++)
                {
                    Clients[i].Close();
                }
                server.Dispose();
                server = null;
                Console.WriteLine("RESTARTING SERVER");
            }
        }
        static void BroadCast(string msg)
        {
           // Console.WriteLine("Broadcasting->"+msg);
            for (int i = 0; i < Clients.Count; i++)
            {
                Clients[i].Send(msg);
            }
        }
    }
}
