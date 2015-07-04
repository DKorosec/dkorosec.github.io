var MAP = 
{  
	Canvas: null,
	Ctx: null,
	MapY: 15,
	MapX: 15,
	Map: null,
	TileDim: 50,
	BombsMatrix: null,
	ExplosionMatrix: null, //ZA HIT DETECTION BO KORISTIL
	ExplosionRenderMatrix: null, //Za rendanje :)
	WallDestroyRenderMatrix:null, //Za rendanje wallov ki se unicijujejo! (samo za lepoto)
	PowerUpMatrix: null,
	PreDefinedPowerUpLocations: null,
	MapStatusEnum: Object.freeze({SOLID_BORDER: 1, SOLID_WALL: 2, WALL:3, FLOOR: 4}),
	PowerUpEnum: Object.freeze({RANGE: 0, BOMB: 1, SPEED:3,PENALTY:8}),
	IsFloor: function(X,Y)
	{
		return this.Map[Y][X] == this.MapStatusEnum.FLOOR;
	},
	IsWall: function(X,Y)
	{
		return this.Map[Y][X] == this.MapStatusEnum.WALL;
	},
	
	Get2DArray: function(d1,d2)
	{
		var ret = new Array(d1);
		for(var i=0;i<d1;i++)
			ret[i] = new Array(d2);
		return ret;
	},
	
	GetBoundingCells: function(x,y)
	{
		var self = this;
		var ret = [];
		for(var i=-1;i<=1;i++)
		{
			for(var j=-1;j<=1;j++)
				if(x+i<0 || y+i<0)
				{
					ret.push(
					{
						Walkable: false,
						Collides: function(X,Y){ return true; }
					}
					);
				}
				else
				{
					ret.push({
						Walkable: this.Map[y+i][x+j]==this.MapStatusEnum.FLOOR || this.Map[y+i][x+j]==this.MapStatusEnum.WALL && false ,
						_j: j,
						_i: i,
						Collides: function(X,Y)
						{
							//console.log(((x+this._j)*self.TileDim)+"<"+X+" && "+X+"<"+((x+this._j+1)*self.TileDim)+" && "+((y+this._i)*self.TileDim)+"<"+Y+" && "+Y+"<!"+((y+this._i+1)*self.TileDim));
							return ((x+this._j)*self.TileDim <= X && X <= (x+this._j+1)*self.TileDim && (y+this._i)*self.TileDim <= Y && Y <= (y+this._i+1)*self.TileDim );
						}
					});
				}
		}
		return ret;
	},
	GetCellXY: function(x,y)
	{
		return {x: x*this.TileDim, y: y*this.TileDim};
	},
	CellPosToXY: function(X,Y)
	{
		return {x: Math.floor(X/this.TileDim), y: Math.floor(Y/this.TileDim)};
	},
	_CellPosToXY: function(XY)
	{
		return {x: Math.floor(XY.x/this.TileDim), y: Math.floor(XY.y/this.TileDim)};
	},
	Init: function(can,ctx)
	{
	 	this.Canvas = can;
		this.Ctx = ctx;
		this.InitPrepareMap();
		this.InitRenderBasicMap();	
		
		/*
		var startPos = this.GetCellXY(1,1);
		PLAYA_MAN = PlayerGen.CreatePlayer(startPos.x,startPos.y);
		startPos = this.GetCellXY(this.MapX-2,this.MapY-2);
		PlayerGen.CreatePlayer(startPos.x,startPos.y);
		*/
	},
	SetRender: function(MapStatus,y,x)
	{
		switch(MapStatus)
		{
			case this.MapStatusEnum.SOLID_BORDER:
				this.Ctx.drawImage(GAME.SpriteBankImage,0+16*3+0.2,170,16,16,this.TileDim*x,this.TileDim*y,this.TileDim,this.TileDim);
			break;
			case this.MapStatusEnum.SOLID_WALL: //*4!
				this.Ctx.drawImage(GAME.SpriteBankImage,0+16*4,170,16,16,this.TileDim*x,this.TileDim*y,this.TileDim,this.TileDim);
			break;
			case this.MapStatusEnum.WALL:
				this.Ctx.drawImage(GAME.SpriteBankImage,0+16*2,170,16,16,this.TileDim*x,this.TileDim*y,this.TileDim,this.TileDim);
			break;
			case this.MapStatusEnum.FLOOR:
				this.Ctx.drawImage(GAME.SpriteBankImage,0+16*0,170,16,16,this.TileDim*x,this.TileDim*y,this.TileDim,this.TileDim);
			break;
			default:
				return false;	
		}
		return true;
	},
	InitPrepareMap: function()
	{
		this.Canvas.width = this.TileDim*(this.MapX+0);
		this.Canvas.height = this.TileDim*(this.MapY+0);
		
		this.Map = this.Get2DArray(this.MapY,this.MapX);
		this.BombsMatrix = this.Get2DArray(this.MapY,this.MapX);
		this.ExplosionMatrix = this.Get2DArray(this.MapY,this.MapX);
		this.ExplosionRenderMatrix = this.Get2DArray(this.MapY,this.MapX);
		this.WallDestroyRenderMatrix = this.Get2DArray(this.MapY,this.MapX);
		this.PowerUpMatrix = this.Get2DArray(this.MapY,this.MapX);
		this.PreDefinedPowerUpLocations = this.Get2DArray(this.MapY,this.MapX);
		for(var y=0;y<this.MapY;y++)
		{
			for(var x=0;x<this.MapX;x++)
			{
				this.BombsMatrix[y][x] = null;
				this.ExplosionMatrix[y][x] = null;
				this.ExplosionRenderMatrix[y][x] = null;
				this.WallDestroyRenderMatrix[y][x] = null;
				this.PowerUpMatrix[y][x] = null;
				this.PreDefinedPowerUpLocations[y][x] = null;
				var randVal = Math.random();
				if(y==0 || y==this.MapY-1 || x==0 || x==this.MapX-1)
					this.Map[y][x] = this.MapStatusEnum.SOLID_BORDER;
				else if(x%2==0 && y%2==0)
					this.Map[y][x] = this.MapStatusEnum.SOLID_WALL;
				else if(randVal<=0.7) //0.7!
				{
					this.Map[y][x] = this.MapStatusEnum.WALL;
					if(Math.random()<=0.40)
					{
						var rndArr = [0,1,0,1,0,1,3,8];
						var pick = rndArr[Math.floor(Math.random()*rndArr.length)];
						this.PreDefinedPowerUpLocations[y][x] = pick;
					}
				}
				else
					this.Map[y][x] = this.MapStatusEnum.FLOOR;
			}
		}
		this.InitPrepareMapForPlayerStart();
		//console.table(this.PreDefinedPowerUpLocations);
	},
	InitPrepareMapForPlayerStart: function()
	{
		//now clean borders! +1 ker je crno okoli
		this.Map[0+1][0+1] = this.MapStatusEnum.FLOOR;
		this.Map[0+1][1+1] = this.MapStatusEnum.FLOOR;
		this.Map[1+1][0+1] = this.MapStatusEnum.FLOOR;
		
		this.Map[0+1][this.MapX-1-1] = this.MapStatusEnum.FLOOR;
		this.Map[1+1][this.MapX-1-1] = this.MapStatusEnum.FLOOR;
		this.Map[0+1][this.MapX-2-1] = this.MapStatusEnum.FLOOR;
		
		this.Map[this.MapY-2][0+1] = this.MapStatusEnum.FLOOR;
		this.Map[this.MapY-2][1+1] = this.MapStatusEnum.FLOOR;
		this.Map[this.MapY-3][0+1] = this.MapStatusEnum.FLOOR;		
		
		this.Map[this.MapY-2][this.MapX-2] = this.MapStatusEnum.FLOOR;
		this.Map[this.MapY-2-1][this.MapX-2] = this.MapStatusEnum.FLOOR;
		this.Map[this.MapY-2][this.MapX-2-1] = this.MapStatusEnum.FLOOR;
	},
	InitRenderBasicMap: function()
	{
		for(var y=0;y<this.MapY;y++)
		{
			for(var x=0;x<this.MapX;x++)
			{

				this.SetRender(this.Map[y][x],y,x);
				//this.Ctx.fillRect(this.TileDim*x,this.TileDim*y,this.TileDim,this.TileDim);
			}
		}
	},
	RenderBombs: function()
	{
		for(var y=0;y<this.MapY;y++)
		{
			for(var x=0;x<this.MapX;x++)
			{
				if(this.PowerUpMatrix[y][x] != null)
				{
					this.PowerUpMatrix[y][x].Render();
				}
				if(this.BombsMatrix[y][x] != null)
				{
					if(this.BombsMatrix[y][x].exploded)
					{
						this.ExplosionRenderMatrix[y][x] = this.BombsMatrix[y][x].GetExplosion();
						this.ExplosionRenderMatrix[y][x].Activate();
						this.BombsMatrix[y][x]=null;
					}
					else
					{
						if(this.ExplosionMatrix[y][x]!=null)
							this.BombsMatrix[y][x].exploded=true;
						else
							this.BombsMatrix[y][x].Render();
					}
				}
				if(this.ExplosionRenderMatrix[y][x] != null)
				{
					if(this.ExplosionRenderMatrix[y][x].over)
					{
						this.ExplosionRenderMatrix[y][x] = null;
					}
					else
					{
						this.ExplosionRenderMatrix[y][x].Render();
					}
				}
				
				if(this.WallDestroyRenderMatrix[y][x] != null)
				{
					if(this.WallDestroyRenderMatrix[y][x].exploded)
					{
						this.WallDestroyRenderMatrix[y][x] = null;
					}
					else
					{
						this.WallDestroyRenderMatrix[y][x].Render();
					}
				}
				if(this.ExplosionMatrix[y][x] != null)
				{
					if(this.PowerUpMatrix[y][x] != null)
					{
						this.PowerUpMatrix[y][x] = null;
					}
					for(var i=0;i<GAME.Players.length;i++)
				    {
						if(GAME.Players[i].dead)
							continue;
						var pos = GAME.Players[i].CellOnFoot();
						if(y == pos.y && x == pos.x)
						{
							GAME.Players[i].dead = true;
							GAME.Players[i].SetDeadAnimation();
						}
					}
				}
			}
		}
		for(var i=0;i<GAME.Players.length;i++)
		{
	
			if(GAME.Players[i].deadAnimation != null)
			{
				if(!GAME.Players[i].deadAnimation.over)
					GAME.Players[i].deadAnimation.Render();
				else
					GAME.Players[i].deadAnimation = null;
			}
		}	
	}
};
function _GetCenterTile(tileXY)
{
	return {x:tileXY.x*MAP.TileDim+MAP.TileDim*0.5,y:tileXY.y*MAP.TileDim+MAP.TileDim*0.5};
}