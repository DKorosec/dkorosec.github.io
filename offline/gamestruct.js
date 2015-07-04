var GAME =
{
	SpriteBankImage: null,
	Players: [],
	Paused: false,
	BackgroundAudio:null,
	EngineIntervalHandle: null,
	EndGameHandle: null,
	AILogicHandle: null,
	AISettings: null,
	AI: [],
	NumberOfPlayers: 4,
	
	Init: function()
	{
		this.AISettings = GetAISettings();
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
		var pos = [[mx,my],[MX,MY],[MX,my],[mx,MY]];
		for(var i=0;i<NoPlayers && i<4;i++)
		{
			this.Players.push(
				PlayerGen.CreatePlayer(pos[i][0],pos[i][1],i)
			);
			
			//NACENTRIRAJ! Inverse enacbe ki ti da pozicijo noge //{x:pCell.x*MAP.TileDim+MAP.TileDim*0.5,y:pCell.y*MAP.TileDim+MAP.TileDim*0.5};
			//tako da dobimo dejanski x in y da bo pozciija noge na centru!
			this.Players[i].SetCenterCell();
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
	ResetBombSoundsPrevGame: function()
	{
		for(var y=0;y<MAP.MapY;y++)
		{
			for(var x=0;x<MAP.MapX;x++)
			{
				if(MAP.BombsMatrix[y][x] != null && MAP.BombsMatrix[y][x].SoundHandle != null)
				{
					clearInterval(MAP.BombsMatrix[y][x].SoundHandle);
					MAP.BombsMatrix[y][x].SoundPlayed=true;
				}
			}
		}
	},
	ResetEngine: function()
	{
		this.ResetBombSoundsPrevGame();
		clearInterval(this.EngineIntervalHandle);
		clearInterval(this.AILogicHandle);
		this.EngineIntervalHandle = null;
		if(this.EndGameHandle != null)
			this.EndGameHandle.pause();
		this.EndGameHandle = null;
		this.BackgroundAudio.src = "";
		this.BackgroundAudio = null;
		this.BackgroundAudio = null;
		this.SpriteBankImage = null;
		this.AI = [];
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
			this.AISettings = GetAISettings();
			this.RenderPause("GAME PAUSED");
			if(this.BackgroundAudio != null)
				this.BackgroundAudio.pause();
		}
		else
		{
			var cmp = GetAISettings();
			//compare for diff
			for(var i=0;i<cmp.length;i++)
			{
				if(cmp[i].AI != this.AISettings[i].AI || cmp[i].Smart != this.AISettings[i].Smart)
				{
					this.ResetEngine();
					return;
				}
			}
			this.BackgroundAudio.play();
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
				if(self.Paused || self.Players[i].isAI || self.Players[i].dead)
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
				if(self.Paused || self.Players[i].isAI ||  self.Players[i].dead)
					continue;
				self.Players[i].TryKeyUp(e.keyCode);
			}
			//console.log(e);
		}
		/*
		AI = new Array(3);
		for(var i=1;i<4;i++)
		AI[i-1] = InjectAI(this.Players[i]);
		setInterval(function(){ for(var i=0;i<3;i++)AI[i].Update(); },10);
		*/
		
		
		for(var i=0;i<this.NumberOfPlayers;i++)
		{
			if(this.AISettings[i].AI)
			{
				var AIh = InjectAI(this.Players[i]); //TODO: Naj ta funkcija prepiše metode objekta, tako da ne rabi if stavkov v runtim-u kjer preverja ali je ai ali ne, da uporabi doloceno metodo.
				AIh.isRisky = !this.AISettings[i].Smart;
				this.AI.push(AIh);
			}
			
		}
		this.AILogicHandle = setInterval(function(){ for(var i=0;i<self.AI.length;i++)self.AI[i].Update(); },10);
		
		
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