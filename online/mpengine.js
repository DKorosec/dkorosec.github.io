CLIENT = true;
C_ID = -1;
GAME_START = false;
GAME_FINISH = false;
SERVER_INT_HANDLE = null;
websocket = null;


function MAP_READY_SOCK() //called when MAP is loaded by serverclient
{
	if(websocket==null)
	{
		ServerSetup();
	}
	else
	{
		/*
		if(C_ID == 0) //Jaz sem server! poslji novo mapo :)
		{
			//var ret = generateJSON(2,MAP.Map,MAP.PreDefinedPowerUpLocations,-1,true,{x:0,y:0},C_ID);
			//websocket.send(ret);		
		}
		else
		{
			C_ID = -1;
		}
		*/
	}
}
/*
  FPS VRZI NA 30 !
  Mogoce zaradti prevlega fpsa se cpu cas pozere in nemorejo web socketi tako hitro posiljat?
  
  KOPIRAJ FAJL (backupaj in probaj)
*/
function ServerSetup()
{
	websocket = new WebSocket("ws://"+URL_GET("host"));
	websocket.onclose = function(evt) { alert("Connection closed!"); };
	websocket.onerror = function(evt) { alert("Connection error!");}
	websocket.onmessage = function(packet) 
	{
		var data = JSON.parse(packet.data);
		if(data.H == 0)
		{
			C_ID = data.PID;
			var ret = generateJSON(2,MAP.Map,MAP.PreDefinedPowerUpLocations,-1,true,{x:0,y:0},C_ID);
			websocket.send(ret);
			return;
		}
		if(data.H == 1)
		{
			C_ID = data.PID;
			GAME.NumberOfPlayers = data.K;
			return;
		}
		if(data.H == 2)
		{
			GAME_START = true;
			GAME.PauseGame();
			MAP.Map = data.M;
			MAP.PreDefinedPowerUpLocations = data.P;
			return;
		}
		if(data.H == 3)
		{
			if(GAME.Paused)
				return; //Nena updejtaj tu rajse saj bi ob inicializaciji lahko dobil kake stare pakete in se restiral!
			//if GAME.Players[i].dead ?
			if(data.X != -1 && data.Y != -1) //POGLEJ CE JE STATUS PAKETA IZ ISTE IGRE!!!!!!! TO PREVERIS TAKO VODIS GAME++ variablo in jo posljes zraven paketka :)
			{

				GAME.Players[data.PID].x = data.X;
				GAME.Players[data.PID].y = data.Y;

			}
			if(data.R)
				GAME.Players[data.PID].TryKeyUp(data.K);
			else
				GAME.Players[data.PID].TryKeyDown(data.K);
		}  //else data.H pomeni stevilo playerov? al pa v data.H == 0 poslji v K st playerov al neke takega xD
		if(data.H == 4) //server zahteva stanje na serveru
		{
			if(data.PID == 20) //zahteva za stanje igre!
			{
				if(GAME_FINISH)
				{
					websocket.send(generateJSON(1111)); //Igra koncana!
				}
				else if(!GAME_FINISH && GAME_START)
					websocket.send(generateJSON(1000)); //Igra tece!
				else
				{
					GAME.RenderText("WAITING PLAYERS:  "+data.X+" of "+data.Y);
					websocket.send(generateJSON(1001)); //Igra caka!
				}
			}
			if(data.PID == 30) //zahteva se reset!
			{
				GAME_START = false;
				GAME_FINISH = false;
				GAME.ResetEngine();
			}
		}
	};
	
	
	/*
	setTimeout(function () 
	{
		if (websocket.readyState == 1) 
		{
			console.log("Connection is made");
		} else {
			alert("SOCKET ERROR->"+websocket.readyState);
		}
	}, 1000);*/
}


function URL_GET(q,s) {
    s = (s) ? s : window.location.search;
    var re = new RegExp('&amp;'+q+'=([^&amp;]*)','i');
    return (s=s.replace(/^\?/,'&amp;').match(re)) ?s=s[1] :s='';
}
function generateJSON(Header,MapMat,PickUpMat,Key,Released,PosXY,PID)
{
   if (typeof(Header)==='undefined') Header = null;
   if (typeof(MapMat)==='undefined') MapMat = null;
   if (typeof(PickUpMat)==='undefined') PickUpMat = null;
   if (typeof(Key)==='undefined') Key = null;
   if (typeof(Released)==='undefined') Released = null;
   if (typeof(PosXY)==='undefined') PosXY = {x:-1,y:-1};
   if (typeof(PID)==='undefined') PID = null;
	return JSON.stringify({
		H:Header,
		M:MapMat,
		P:PickUpMat,
		K:Key,
		R:Released,
		X:PosXY.x,
		Y:PosXY.y,
		PID:PID
	});
}
/*
{
  H: 0 -> INIT (posiljanje mape)| 1 -> GAME posiljanje keyov
  M: null if H=1 | [[],[],[],[]];
  P: null if H=1 | [[],[],[],[]];
  K: key if H = 1{UP,DOWN,LEFT,RIGHT} else NULL
  R: Key relese = true or false
  XY: pos if H = 1 else NULL
  PID: 0-4 preko tega lahko O[1] -> tryKey posljes!
}*/