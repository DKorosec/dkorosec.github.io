var GAME =
{
	SpriteBankImage: null,
	Players: [],
	Paused: false,
	BackgroundAudio:null,
	EngineIntervalHandle: null,
	EndGameHandle: null,
	NumberOfPlayers: 4,
	
	Init: function()
	{
		this.PrepareSpritesAndInitMap();
		this.PrepareAudio();
	},
	PrepareAudio: function()
	{
		this.BackgroundAudio = new Audio('audio/background2.mp3');
		this.BackgroundAudio.play();
		this.BackgroundAudio.loop = true;
		this.BackgroundAudio.volume=0.1;
		//https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	},
	PrepareSpritesAndInitMap: function()
	{
		
		this.SpriteBankImage= new Image();
		var self = this;
		var Canvas = document.getElementById("ctx");
		var Ctx = Canvas.getContext("2d");

		this.SpriteBankImage.onload = function() {

			MAP.Init(Canvas,Ctx);
			self.EngineStart();
		};
		this.SpriteBankImage.src = 'sprites/players.png';
	},
	generateContext: function(width, height) 
	{
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas.getContext("2d");
	},
	
	PlayersInit: function(NoPlayers)
	{
		var MX = (MAP.MapX-2)*MAP.TileDim;
		var MY = (MAP.MapY-2)*MAP.TileDim;
		var mx = 1*MAP.TileDim;
		var my = 1*MAP.TileDim;
		var pos = [[my,my],[MX,MY],[MX,my],[mx,MY]];
		for(var i=0;i<NoPlayers && i<4;i++)
		{
			this.Players.push(
				PlayerGen.CreatePlayer(pos[i][0],pos[i][1],i)
			);
		}
	},
	RenderPause: function(Text)
	{
		MAP.Ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		MAP.Ctx.fillRect(0,0,MAP.Canvas.width,MAP.Canvas.height);
		MAP.Ctx.font = "52px Consolas";
		MAP.Ctx.fillStyle = "white";
		var data = MAP.Ctx.measureText(Text);
		MAP.Ctx.fillText(Text,MAP.Canvas.width/2 - data.width/2,MAP.Canvas.height/2);
	},
	ResetEngine: function()
	{
		clearInterval(this.EngineIntervalHandle);
		this.EngineIntervalHandle = null;
		if(this.EndGameHandle != null)
			this.EndGameHandle.pause();
		this.EndGameHandle = null;
		this.BackgroundAudio.src = "";
		this.BackgroundAudio = null;
		this.BackgroundAudio = null;
		this.SpriteBankImage = null;
		this.Players = [];
		this.Paused = false;
		//this.NumberOfPlayers=4 "NESMES!"
		
		this.Init();
		
		//document.location.href = ""; //TU NOT LAHKO VARIABLE SHRANIŠ DA USERA NE RAZPALI KO BO MOGO ZNOVA NASTAVLAT!!!
	},
	PauseGame: function(arg)
	{
		var game = document.getElementById("ctx");

		if(this.EndGameHandle != null || game.style.display == "none" && arg != "controlReq" )
			return;
		this.Paused = !this.Paused;
		if(this.Paused)
		{
			this.RenderPause("GAME PAUSED");
		}
		
	},
	
	OpenCloseControls: function()
	{
		this.PauseGame("controlReq");
		
		var table = document.getElementById("table-container");
		var game = document.getElementById("ctx");
		
		//alert(game.style+" | "+table.style+"| ("+(this.Paused)+")");
		if(this.Paused)
		{
			game.style.display = "none";
			table.style.display = "";
		}
		else
		{
			game.style.display = "";
			table.style.display = "none";
		}
	},
	EngineStart: function()
	{
		//var startPos = MAP.GetCellXY(1,1);
		//var Player = PlayerGen.CreatePlayer(startPos.x,startPos.y,0);
		//var startPos2 = MAP.GetCellXY(13,13);
		//var Player2 = PlayerGen.CreatePlayer(startPos2.x,startPos2.y);
		
		this.PlayersInit(this.NumberOfPlayers);
		//this.Players.push(Player2);
		var self = this;
		
		document.onkeydown = function(e)
		{
			for(var i=0;i<self.Players.length;i++)
			{
				if(self.Paused || self.Players[i].dead)
					continue;
				self.Players[i].TryKeyDown(e.keyCode);
			}
		}	
		document.onkeyup = function(e)
		{
			if(e.keyCode == 80)
			{  
				self.PauseGame();
			}
			if(e.keyCode == 82)
			{
				self.ResetEngine();//
			}
			if(e.keyCode == 67)
			{
				self.OpenCloseControls();
			}
			for(var i=0;i<self.Players.length;i++)
			{
				if(self.Paused || self.Players[i].dead)
					continue;
				self.Players[i].TryKeyUp(e.keyCode);
			}
			//console.log(e);
		}
		
		
		this.EngineIntervalHandle = setInterval(function(){
			if(self.Paused)
				return;
			MAP.InitRenderBasicMap();
			MAP.RenderBombs();
			
			var alive = 0;
			
			for(var i=0;i<self.Players.length;i++)
			{	
				if(!self.Players[i].dead)
				{
					self.Players[i].Update();	
					alive++;
				}
			}
			//console.log(alive + "|" + (self.EndGameHandle != null));
			if(alive<2 && self.EndGameHandle == null)
			{
				var colors = ["WHITE","GREEN","RED","BLUE"];
				self.EndGameHandle = new Timer(function(){
					clearInterval(self.EngineIntervalHandle);  
					MAP.InitRenderBasicMap();
					MAP.RenderBombs();
					var _id = -1;
					for(var i=0;i<self.Players.length;i++)
					{	
						if(!self.Players[i].dead)
						{
							self.Players[i].Update();	
							_id= i;
						}
					}
					if(_id != -1)
						self.Players[_id].Update();	
					if(_id==-1)
						self.RenderPause("DRAW GAME!");
					else
						self.RenderPause(colors[_id]+" PLAYER WINS!");
			    }, 3000);
			}
			
		}, 1000/60);
	}
};