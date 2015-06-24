//BOMBERMAN IMA ARRAY O(1) PERKOV in med preki je tut range bombe ki gre z pickupi ++!
function GetBomb(X,Y,PlayerRoot)
{
	return {
		x:X,
		y:Y,
		RootPlayer: PlayerRoot,
		range:PlayerRoot.BombRange,
		IntervalHandle: null,
		SoundHandle: null,
		frames: [0,1,0,2],
		frameIdx: 0,
		explodeMs: 3000,
		exploded:false,
		Sound: null,
		SoundPlayed: false,
		TimerHandle: null,
		Activate: function()
		{
			this.RootPlayer.MaxBombs--;
			this.Sound = new Audio('audio/bomb.mp3');
			this.Sound.volume=0.3;
			var self = this;
			this.IntervalHandle = setInterval(function(){ 
			
				//console.log(GAME.Paused+" && "+self.TimerHandle.On());
				//console.log(self.TimerHandle);
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
			}, 500);
			this.SoundHandle = setInterval(function(){ 
				
				if(self.TimerHandle != null)
				{
					if(GAME.Paused)
					{
						if(self.TimerHandle.On())
							self.TimerHandle.pause();
						return;
					}else if(!self.TimerHandle.On()) self.TimerHandle.resume();
				}
				if(self.exploded && !self.SoundPlayed)
				{
					self.Sound.play();
					self.SoundPlayed=true;					
				}
			}, 50);
			
			this.TimerHandle = new Timer(function(){ clearInterval(self.IntervalHandle); clearInterval(self.SoundHandle); self.RootPlayer.MaxBombs++;  self.exploded=true; if(!self.SoundPlayed){ self.Sound.play(); self.SoundPlayed=true; } }, self.explodeMs);
			//setTimeout(function(){ clearInterval(self.IntervalHandle); clearInterval(self.SoundHandle);  self.exploded=true; if(!self.SoundPlayed){ self.Sound.play(); self.SoundPlayed=true; } }, self.explodeMs);
		},
		Render: function()
		{
			MAP.Ctx.drawImage(GAME.SpriteBankImage,154+this.frames[this.frameIdx]*16,204,15,17,MAP.TileDim*this.x+MAP.TileDim*0.15,MAP.TileDim*this.y+MAP.TileDim*0.15,MAP.TileDim*0.7,MAP.TileDim*0.7);
		},
		GetExplosion: function()
		{
			return GetExplosion(this.x,this.y,this.range);
		}
	};
}
//NESME IT EXPLOZIJA CEZ CIGEL, KER DRUGACE SE POWER UP ZJEBE :)!
function GetExplosion(X,Y,RANGE)
{
	return {
		x: X,
		y: Y,
		range: RANGE,
		over:false,
		frameIdx:0,
		frames:[3,2,1,0,1,2,3],
		IntervalHandle: null,
		durationMs: 500,
		maxX:0,minX:0,maxY:0,minY:0,
		maxXW:false,minXW:false,maxYW:false,minYW:false,
		cleaningDone:false,
		TimerHandle: null,
		Activate: function()
		{
			var self = this;
			this.IntervalHandle = setInterval(function(){ 
			
				if(self.TimerHandle != null)
				{
					if(GAME.Paused)
					{
						if(self.TimerHandle.On())
							self.TimerHandle.pause();
						return;
					}else if(!self.TimerHandle.On()) self.TimerHandle.resume();
				}
			
				self.frameIdx++;
				if(self.frameIdx==self.frames.length)
					self.frameIdx=0;
			}, 72);
			
			
			this.TimerHandle = new Timer(function(){ self.CleanUpExplosionMatrix(); clearInterval(self.IntervalHandle);  self.over=true; }, self.durationMs);
		},
		
		BasicRender: function()
		{
			MAP.Ctx.drawImage(GAME.SpriteBankImage,74+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*this.x,MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
			for(var i=1;true;i++){ //gor konica 10 221
			    if(this.minY==0)
					break;
				
				if(this.y-i==this.minY)
				{
					if(this.minYW)
						MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y-i),MAP.TileDim,MAP.TileDim);
					else
						MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y-i),MAP.TileDim,MAP.TileDim);
					
					break;
				}
				else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y-i),MAP.TileDim,MAP.TileDim);
			
			}
			for(var i=1;true;i++){ //dol konica 138 221       //266 221 navpicno
			    if(this.maxY==0)
					break;
				if(this.y+i==this.maxY)
				{
					if(this.maxYW)
						MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y+i),MAP.TileDim,MAP.TileDim);
					else
						MAP.Ctx.drawImage(GAME.SpriteBankImage,138+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y+i),MAP.TileDim,MAP.TileDim);
					
					break;
				}
				else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y+i),MAP.TileDim,MAP.TileDim);
				
			}
			for(var i=1;true;i++){ //levo konica 202 221      //10 237  vodoravno 
				if(this.minX==0)
					break;
				if(this.x-i==this.minX)
				{
					if(this.minXW)
					MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x-i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,202+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*(this.x-i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					
					break;
				}
				else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x-i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
				
			}
			for(var i=1;true;i++){ //desno konica 74 221
				if(this.maxX==0)
					break;
				if(this.x+i==this.maxX)
				{
					if(this.maxXW)
					MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x+i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,74+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*(this.x+i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					
					break;
				}
				else
					MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x+i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
				
			}
		},
		
		CleanUpExplosionMatrix: function()
		{
			//rabimo posebni clear saj ko se kocka porusi (strela je bla krajsa) se pol logicno ko se obrise lahko preko polja brise! (drugo strelo)
			//console.table(MAP.ExplosionMatrix);
			MAP.ExplosionMatrix[this.y][this.x]=null;
			
		    for(var i=0;true;i++){ //gor konica 10 221
			    if(this.minY==0)
					break;
				MAP.ExplosionMatrix[this.y-i][this.x]=null;
				if(this.y-i==this.minY)
					break;
			}
			for(var i=0;true;i++){ //dol konica 138 221       //266 221 navpicno
			     if(this.maxY==0)
					break;
				MAP.ExplosionMatrix[this.y+i][this.x]=null;
				if(this.y+i==this.maxY)
					break;
			}
			for(var i=0;true;i++){ //levo konica 202 221      //10 237  vodoravno 
				if(this.minX==0)
					break;
				MAP.ExplosionMatrix[this.y][this.x-i]=null;
				if(this.x-i==this.minX)
					break;
			}
			for(var i=0;true;i++){ //desno konica 74 221
				if(this.maxX==0)
					break;
				MAP.ExplosionMatrix[this.y][this.x+i]=null;
				if(this.x+i==this.maxX)
					break;
			}
			//console.table(MAP.ExplosionMatrix);
		},
		Render: function()
		{
			//Root explosion!
			
			if(this.cleaningDone)
			{
			  this.BasicRender();
			  return;
			}
			
			
			MAP.ExplosionMatrix[this.y][this.x]=1;
			MAP.Ctx.drawImage(GAME.SpriteBankImage,74+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*this.x,MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
		    for(var i=1;i<this.range;i++){ //gor konica 10 221
			    if(!MAP.IsFloor(this.x,this.y-i))
				{
					if(MAP.IsWall(this.x,this.y-i))
					{
						MAP.Map[this.y-i][this.x] = MAP.MapStatusEnum.FLOOR;
						MAP.WallDestroyRenderMatrix[this.y-i][this.x] = GetAnimatedWall(this.x,this.y-i);
						MAP.WallDestroyRenderMatrix[this.y-i][this.x].Activate();
					}
					this.minYW=true;
					break;
				}
				this.minY = this.y-i;
				MAP.ExplosionMatrix[this.y-i][this.x]=1;
			   	if(i+1>=this.range)
				{
					//draw spike
					MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y-i),MAP.TileDim,MAP.TileDim);
					break;
				}
				MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y-i),MAP.TileDim,MAP.TileDim);
			}
			for(var i=1;i<this.range;i++){ //dol konica 138 221       //266 221 navpicno
			   	 if(!MAP.IsFloor(this.x,this.y+i))
				 {
					if(MAP.IsWall(this.x,this.y+i))
					{
						MAP.Map[this.y+i][this.x] = MAP.MapStatusEnum.FLOOR;
						MAP.WallDestroyRenderMatrix[this.y+i][this.x] = GetAnimatedWall(this.x,this.y+i);
						MAP.WallDestroyRenderMatrix[this.y+i][this.x].Activate();
						
					}
					this.maxYW=true;
					break;
				 }
				this.maxY = this.y+i;
				MAP.ExplosionMatrix[this.y+i][this.x]=1;
				if(i+1>=this.range)
				{
					//draw spike
					MAP.Ctx.drawImage(GAME.SpriteBankImage,138+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y+i),MAP.TileDim,MAP.TileDim);
					break;
				}
				MAP.Ctx.drawImage(GAME.SpriteBankImage,266+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*this.x,MAP.TileDim*(this.y+i),MAP.TileDim,MAP.TileDim);
			}
			for(var i=1;i<this.range;i++){ //levo konica 202 221      //10 237  vodoravno 
			   	 if(!MAP.IsFloor(this.x-i,this.y))
				 {
					if(MAP.IsWall(this.x-i,this.y))
					{
						MAP.Map[this.y][this.x-i] = MAP.MapStatusEnum.FLOOR;
						MAP.WallDestroyRenderMatrix[this.y][this.x-i] = GetAnimatedWall(this.x-i,this.y);
						MAP.WallDestroyRenderMatrix[this.y][this.x-i].Activate();
					}
					this.minXW=true;
					break;
				 }
				
				this.minX = this.x-i;
				MAP.ExplosionMatrix[this.y][this.x-i]=1;
				if(i+1>=this.range)
				{
					//draw spike
					MAP.Ctx.drawImage(GAME.SpriteBankImage,202+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*(this.x-i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					break;
				}
				MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x-i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
			}
			for(var i=1;i<this.range;i++){ //desno konica 74 221
			   	 if(!MAP.IsFloor(this.x+i,this.y))
				 {
					if(MAP.IsWall(this.x+i,this.y))
					{
						MAP.Map[this.y][this.x+i] = MAP.MapStatusEnum.FLOOR;
						MAP.WallDestroyRenderMatrix[this.y][this.x+i] = GetAnimatedWall(this.x+i,this.y);
						MAP.WallDestroyRenderMatrix[this.y][this.x+i].Activate();
					}
					this.maxXW=true;
					break;
				 }
				this.maxX = this.x+i;
				MAP.ExplosionMatrix[this.y][this.x+i]=1;
				if(i+1>=this.range)
				{
					//draw spike
					MAP.Ctx.drawImage(GAME.SpriteBankImage,74+(this.frames[this.frameIdx]*16),221,16,16,MAP.TileDim*(this.x+i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
					break;
				}
				MAP.Ctx.drawImage(GAME.SpriteBankImage,10+(this.frames[this.frameIdx]*16),237,16,16,MAP.TileDim*(this.x+i),MAP.TileDim*this.y,MAP.TileDim,MAP.TileDim);
			}
			this.cleaningDone = true;
		}
	};
} 