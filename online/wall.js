function GetAnimatedWall(X,Y)
{
	return {
		x:X,
		y:Y,
		IntervalHandle: null,
		frames: [0,1,2,3,4,5],
		frameIdx: 0,
		durationMs: 500,
		exploded:false,
		TimerHandle: null,
		Activate: function()
		{
			var self = this;
			this.IntervalHandle = setInterval(function(){ 
				//console.log("????");
				if(self.TimerHandle != null)
				{
					if(GAME.Paused)
					{
						if(self.TimerHandle.On())
							self.TimerHandle.pause();
						return;
					}else if(!self.TimerHandle.On()) self.TimerHandle.resume();
				}
				
				self.frameIdx=(self.frameIdx+1)%self.frames.length;
			}, 83);
			this.TimerHandle = new Timer(function(){ clearInterval(self.IntervalHandle);  self.exploded=true; 
				var PowerUp = GeneratePowerUp(self.x,self.y);
				if(PowerUp != null)
				{
					MAP.PowerUpMatrix[self.y][self.x] = PowerUp;
				}
			}, self.durationMs);
		},
		Render: function()
		{
			//58 205
			MAP.Ctx.drawImage(GAME.SpriteBankImage,58+this.frames[this.frameIdx]*16,205,16,16,MAP.TileDim*this.x,MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
		}
	};
}

function GeneratePowerUp(X,Y)
{
	if(MAP.PreDefinedPowerUpLocations[Y][X] == null)
		return null;
	var el = {
		x:X,
		y:Y,
		Sound: null,
		type: MAP.PreDefinedPowerUpLocations[Y][X],
		Init: function()
		{
			this.Sound = new Audio('audio/powerup.mp3');
			this.Sound.volume=0.3;
		},
		Render: function()
		{
			MAP.Ctx.drawImage(GAME.SpriteBankImage,this.type*16,188,16,16,MAP.TileDim*this.x,MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
		}
	};
	el.Init();
	return el;
}

