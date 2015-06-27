var PlayerGen =
{
	//TO SE POKLICE KO CALLBACK JAVI DA JE VSE POHANDALNO :)
	KEYS: [[38,40,37,39,32],[87,83,65,68,70],[73,75,74,76,72],[104,101,100,102,13]],
	PlayerMoveEnum: Object.freeze({DOWN: 0, RIGHT: 1, LEFT:2, UP: 3}),
	PlayerKeyEnum: Object.freeze({DOWN: 1, RIGHT: 3, LEFT:2, UP: 0}),
	PlayerTypeEnum: Object.freeze({WHITE: 1, GREEN: 2, RED:3, BLUE: 4}),
	CreatePlayer: function(_X,_Y,ID)
	{
		var PG = this;
		var PLAYER =  {
			x:_X,
			y:_Y,
			MaxBombs: 1,
			id: ID,
			BombRange: 2,
			MoveSpeed:2.5,
			walking:false,
			firstStep:false,
			dead:false,
			walkFrame:[2,0,1,0],
			walkFrameIdx:0,
			localTimeStamp:0,
			Ctx: MAP.Ctx,
			MovingPos: PG.PlayerMoveEnum.DOWN, //look nicely at the user!
			frameIdx: 0,
			deadAnimation: null,
			
			SetDeadAnimation: function()
			{
				var _Gself = this;
				this.deadAnimation = {
					x:_Gself.x,
					y:_Gself.y,
					pID: _Gself.id,
					IntervalHandle: null,
					frames: [0,1,2,3,4,5,6,7,8],
					frameIdx: 0,
					durationMs: 2000,
					over:false,
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
							self.frameIdx=(self.frameIdx+1)%self.frames.length;
						}, 222);
						this.TimerHandle = new Timer(function(){ clearInterval(self.IntervalHandle);  self.over=true; }, self.durationMs);
					},
					Render: function()
					{
						MAP.Ctx.drawImage(GAME.SpriteBankImage,this.frames[this.frameIdx]*24+10,283+50*this.pID-1,19,22,this.x,this.y,MAP.TileDim,MAP.TileDim);
						//MAP.Ctx.drawImage(GAME.SpriteBankImage,(this.MovingPos*3*24)+24*(this.frameIdx)-2,259+50*this.id-1,22,24,this.x,this.y,MAP.TileDim,MAP.TileDim);
					}
				};
				this.deadAnimation.Activate();
			},
			
			Position: function()
			{
				return {x:this.x+MAP.TileDim/2,y:this.y+MAP.TileDim/2};
			},
			PositionFoot: function()
			{
				return {x:this.x+MAP.TileDim/2,y:this.y+MAP.TileDim*0.85};
			},
			GetBoundPoints: function()
			{
				return [
				    {x:this.x+MAP.TileDim*0.5,y:this.y+MAP.TileDim*0.95},
					{x:this.x+MAP.TileDim*0.30,y:this.y+MAP.TileDim*0.85},
					{x:this.x+MAP.TileDim*0.70,y:this.y+MAP.TileDim*0.85},
					{x:this.x+MAP.TileDim*0.5,y:this.y+MAP.TileDim*0.70},
				];
			},
			CellOn: function()
			{
				return {x:Math.floor(this.x/MAP.TileDim),y:Math.floor(this.y/MAP.TileDim)};
			},
			CellOnFoot: function()
			{
				var foot = this.PositionFoot();
				return {x:Math.floor(foot.x/MAP.TileDim),y:Math.floor(foot.y/MAP.TileDim)};
			},
			CellOnFootOffset: function(X,Y)
			{
				var foot = this.PositionFoot();
				return {x:Math.floor((foot.x+X)/MAP.TileDim),y:Math.floor((foot.y+Y)/MAP.TileDim)};
			},
			Update: function() //gets Called 60 times per second!
			{
				if(this.walking)
				{
					if(this.localTimeStamp%7==0 ||  this.firstStep)
					{
						this.frameIdx = this.walkFrame[this.walkFrameIdx%4];
						this.walkFrameIdx++;
						this.firstStep=false;
					}
					this.MoveTo(this.MovingPos);
				}
				this.Render();
				this.localTimeStamp++;

			},
			Render: function()
			{
				this.Ctx.drawImage(GAME.SpriteBankImage,10+(this.MovingPos*3*24)+24*(this.frameIdx)-2,259+50*this.id-1,22,24,this.x,this.y,MAP.TileDim,MAP.TileDim);
			},
			MoveDirection: function(DIRECTION)
			{
				this.MovingPos = DIRECTION;
				if(!this.walking)
					this.firstStep=true;
				this.walking = true;
			},
			NewPositionCollidesWithMap: function()
			{
				var pos = this.CellOnFoot();
				if(pos.x > MAP.MapX-2 || pos.y > MAP.MapY-2) //out of bounds lower field
					return true;
				var BC = MAP.GetBoundingCells(pos.x,pos.y);
				var PlayerFootPos = this.PositionFoot();
				var PlayerBoundPoints = this.GetBoundPoints();
				for(var i=0;i<BC.length;i++)
				{
					if(!BC[i].Walkable)
					{
						for(var j=0;j<PlayerBoundPoints.length;j++)
						{
							if(BC[i].Collides(PlayerBoundPoints[j].x,PlayerBoundPoints[j].y))
								return true;
						}
					}
				}
				return false;
			},
			NewPositionCollidesWithBomb: function(onBombPos)
			{
				var pos = this.CellOnFoot();
				
				
				//Da uporabnika med dve bombi ulovis :P
				/*
				var H = [this.CellOnFootOffset(-MAP.TileDim*0.2,0),this.CellOnFootOffset(MAP.TileDim*0.2,0)];
				var V = [this.CellOnFootOffset(0,-MAP.TileDim*0.2),this.CellOnFootOffset(0,MAP.TileDim*0.2)];
				//console.clear();
				//console.log(H[0].x+","+H[0].y+"     "+H[1].x+","+H[1].y);
				//console.log(V[0].x+","+V[0].y+"     "+V[1].x+","+V[1].y);
				
				if(MAP.BombsMatrix[H[0].y][H[0].x] != null && MAP.BombsMatrix[H[1].y][H[1].x] != null && (H[0].x != H[1].x || H[0].y != H[1].y)) 
					return true;
				if(MAP.BombsMatrix[V[0].y][V[0].x] != null && MAP.BombsMatrix[V[1].y][V[1].x] != null && (V[0].x != V[1].x || V[0].y != V[1].y))
					return true;
				*/
				if(MAP.BombsMatrix[pos.y][pos.x]!=null)
				{
					if(onBombPos==null)
						return true;
					if(pos.y == onBombPos.y && pos.x == onBombPos.x)
						return false;
					else
						return true;
				}
				
				return false;
				
			},
			MoveTo: function(DIRECTION)
			{
				//console.clear(); //odkomentiraj za anticheat
				var tmpx = this.x;
				var tmpy = this.y;
				var pos = this.CellOnFoot();
				var onBomb = MAP.BombsMatrix[pos.y][pos.x]!=null;
				if(!onBomb)
					pos = null;
				
				switch(DIRECTION)
				{
					case PG.PlayerMoveEnum.DOWN:
						this.y+=this.MoveSpeed;
					break;
					case PG.PlayerMoveEnum.RIGHT:
						this.x+=this.MoveSpeed;
					break;
					case PG.PlayerMoveEnum.LEFT:
						this.x-=this.MoveSpeed;
					break;
					case PG.PlayerMoveEnum.UP:
						this.y-=this.MoveSpeed;
					break;
				}
				if(this.NewPositionCollidesWithMap())
				{
					this.y = tmpy;
					this.x = tmpx;
				}
				if(this.NewPositionCollidesWithBomb(pos))
				{
					this.y = tmpy;
					this.x = tmpx;
				}
				pos = this.CellOnFoot();
				if(MAP.PowerUpMatrix[pos.y][pos.x] != null)
				{
					this.ConsumePowerUp(pos.x,pos.y);
				}
			},
			ConsumePowerUp: function(X,Y)
			{
				var powerUp = MAP.PowerUpMatrix[Y][X];
				MAP.PowerUpMatrix[Y][X] = null;
				powerUp.Sound.play();
				//console.log(powerUp.type);
				
				//PowerUpEnum: Object.freeze({RANGE: 0, BOMB: 1, SPEED:3,PENALTY:8}),
				/*
				 MaxBombs: 2,
				 BombRange: 2,
				 MoveSpeed:2.5,
				*/
				switch(powerUp.type)
				{
					case MAP.PowerUpEnum.RANGE:
						this.BombRange++;
					break;
					case MAP.PowerUpEnum.BOMB: 
						this.MaxBombs++;
					break;
					case MAP.PowerUpEnum.SPEED: 
						this.MoveSpeed++;
					break;
					case MAP.PowerUpEnum.PENALTY: 
						this.MoveSpeed-=0.5;
					break;
				}
			},
			SetBomb: function()
			{
				if(this.MaxBombs==0)
					return;
				var pos = this.CellOnFoot();
				if(MAP.BombsMatrix[pos.y][pos.x]!=null)
					return;
				var bomb = GetBomb(pos.x,pos.y,this);
				MAP.BombsMatrix[pos.y][pos.x] = bomb;
				bomb.Activate();
			},
			TryKeyDown: function(Key)
			{
				if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.UP])//W 
				{
					this.MoveDirection(PG.PlayerMoveEnum.UP);
				}
				else if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.LEFT])//a
				{
					this.MoveDirection(PG.PlayerMoveEnum.LEFT);
				}
				else if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.DOWN])//s
				{
					this.MoveDirection(PG.PlayerMoveEnum.DOWN);
				}
				else if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.RIGHT])//d
				{
					this.MoveDirection(PG.PlayerMoveEnum.RIGHT);
				}
				else if(Key == PG.KEYS[this.id][4])
				{
					this.SetBomb();
				}
			},
			TryKeyUp: function(Key)
			{
				
				if(Key ==  PG.KEYS[this.id][PG.PlayerKeyEnum.UP] && this.MovingPos == PG.PlayerMoveEnum.UP )//W 
				{
					this.walking=false;
					this.frameIdx=0;
				}
				else if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.LEFT] && this.MovingPos == PG.PlayerMoveEnum.LEFT )//a
				{
					this.walking=false;
					this.frameIdx=0;
				}
				else if(Key == PG.KEYS[this.id][PG.PlayerKeyEnum.DOWN] && this.MovingPos == PG.PlayerMoveEnum.DOWN)//s
				{
					this.walking=false;
					this.frameIdx=0;
				}
				else if(Key ==  PG.KEYS[this.id][PG.PlayerKeyEnum.RIGHT] && this.MovingPos == PG.PlayerMoveEnum.RIGHT )//d
				{
					this.walking=false;
					this.frameIdx=0;
				}
			},

		
		};
		return PLAYER;
	}
};