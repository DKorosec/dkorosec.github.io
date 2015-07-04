/*
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

*/

//CellOnFoot
//PlayerKeyEnum: Object.freeze({DOWN: 1, RIGHT: 3, LEFT:2, UP: 0}),
//TryKeyDown
//TryKeyUp
AI_STACK_TYPE = Object.freeze({FOLLOW: 1, DODGE: 2,PICKUP: 3});
function SHORTEN_PATH(obj,MaxSize)
{
	while(obj.path.length > MaxSize)
		obj.path.shift();
	return obj;
}
function InjectAI(PLAYER)
{
	PLAYER.isAI = true;
	return {
		player: PLAYER,
		isAI: true,
		isRisky:false,
		LastPos: {x:-1,y:-1},
		NotMovingCount: 0,
		SafePathMode:false,
		NotMoving: function()
		{
			var pos = this.player.PositionFoot();
			return this.LastPos.x == pos.x && this.LastPos.y == pos.y;
		},
		IsAIDeadLock: function() //Ce je bomba tam ko se ima namen odpravit...
		{
			if(this.player.AIPlan == null)
				return false;
			//var ctx = MAP.Ctx;
			//ctx.fillStyle="#FF0000";
			//ctx.fillRect(this.player.AIPlan.x,this.player.AIPlan.y,10,10);
			var pos = this.player.CellOnFoot();
			var loc = MAP.CellPosToXY(this.player.AIPlan.x,this.player.AIPlan.y);
			
			
			
			
			if(MAP.BombsMatrix[loc.y][loc.x]!=null && loc.x!=pos.x && loc.y!=pos.y)
			{
				return true;
			}
			
			
			var vectors = [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
			for(var i=0;i<vectors.length;i++)
			{
			    if(pos.x+vectors[i].x == loc.x && pos.y+vectors[i].y == loc.y)
					return false;
				//if()
			}
			return true;
		},
		IsDanger: function()
		{
			var PLAN = this.player.AIPlan != null?this.player.AIPlan:null;
			if(PLAN != null)
			{
				var XY = MAP._CellPosToXY(PLAN);
				return (this.BombDanger(this.player.CellOnFoot()) || this.BombDanger(XY) || MAP.ExplosionMatrix[XY.y][XY.x]!=null); 
			}
			else
			{
				return this.BombDanger(this.player.CellOnFoot());
			}
			
		},
		NumberOfBombsHorAndVer: function() //stevilo horizontalnih in vertikalnih bomb do katerih obstaja pot... pac da ni zida vmes
		{
			var center = this.player.CellOnFoot();
			
			var tmp = {x: center.x, y: center.y};
			var bombs_c = 0;
			for(var i=1;true;i++) //i = 1 ker na centru ni nikol bombe ce pa je te pa jo je nekdo ze postavo!
			{
				var bx = tmp.x+i;
				var by = tmp.y;
				if(!MAP.IsFloor(bx,by))
					break;
				if(MAP.BombsMatrix[by][bx]!=null)
					bombs_c++;
			}
			for(var i=1;true;i++)
			{
				var bx = tmp.x-i;
				var by = tmp.y;
				if(!MAP.IsFloor(bx,by))
					break;
				if(MAP.BombsMatrix[by][bx]!=null)
					bombs_c++;
			}
			for(var i=1;true;i++)
			{
				var bx = tmp.x;
				var by = tmp.y+i;
				if(!MAP.IsFloor(bx,by))
					break;
				if(MAP.BombsMatrix[by][bx]!=null)
					bombs_c++;
				
			}
			for(var i=1;true;i++)
			{
				var bx = tmp.x;
				var by = tmp.y-i;
				if(!MAP.IsFloor(bx,by))
					break;
				if(MAP.BombsMatrix[by][bx]!=null)
					bombs_c++;
			}
			return bombs_c;
		},
		Update: function()
		{			
			if(this.player.dead || GAME.Paused)
				return;
			var TILE = MAP.MapStatusEnum;
			var KEY = PlayerGen.PlayerKeyEnum;
			
			if(this.IsAIDeadLock()) //TO SE MORDA NITI NE RABI VEC....  
			{
				//console.log("dead-lock");
				this.player.AIPlan = null;
				this.player.SetCenterCell();
				this.player.AIStack = this.SafePath();
			}else if(this.NotMoving()) //TO PA NUJNO!
			{
				if(this.NotMovingCount++>=10 && this.IsDanger())
				{
					//console.log("LOCKET!")
					this.player.AIStack.path = [];
					this.player.AIPlan = null;
					//this.player.SetCenterCell();//ZAKOMENTIRO OB 3 ZJUTRAJ! MAYBE IM WRONG, SKLICUJ NA TO CE KAJ NE BO STIMALO!
					this.NotMovingCount = 0;
				}
			}
			else
			{
				this.LastPos = this.player.PositionFoot();
				this.NotMovingCount=0;
			}
			
			if(this.IsEnemyClose() && this.NumberOfBombsHorAndVer()<3) //MOGOCE BI BLO BOLSE DA MAX 2 BOMBI NASTAVI?
			{
				/*
					TOTE 3 POBRISI
					CE BO SLO KAJ NAROBE
				*/
				var _pos = this.player.CellOnFoot(); //NAZADNJE DODANO PREDN SEL SPAT
				var logicBomb = {x:_pos.x,y:_pos.y,bomb:{range:this.player.BombRange}}; //NAZADNJE DODANO PREDN SEL SPAT
				var pathRet = this.__SafePathNoPoisonTile(logicBomb);
				/*
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					BOL AGRESIVN STYLE: ODSTRANI && this.NoOfDifferentBombsDangerOnPath(pathRet.path) == 0, samo ret.ok pusti!
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					torej v 
						if(pathRet.ok) 
							this.player.SetBomb();
				
				*/
				if(pathRet.ok && (this.isRisky || this.NoOfDifferentBombsDangerOnPath(pathRet.path) == 0)) 
					this.player.SetBomb();
			}
			if(this.IsDanger() && this.player.AIStack.type != AI_STACK_TYPE.DODGE)
			{
				this.player.AIStack = this.SafePath();//SHORTEN_PATH(this.SafePath(),3);
				this.player.AIPlan = null; //TOTI NULL GA MOGOCE ZAZANKA?
				//this.player.SetCenterCell();
			}
			else if(this.player.AIStack.path.length == 0 && this.player.AIPlan == null)
			{
				if(this.IsDanger())//ce je nevarnost in je stack dodge ampak je prazen se enkrat napolni!
				{
					this.player.AIStack = this.SafePath();//SHORTEN_PATH(this.SafePath(),3);
				}
				else
				{
					var targets = this.GetRndTargetsArr();
					var _path = null;
					if(targets.length != 0)
					{ 
						if(Math.random()<=0.02) //ali pac ne sledi tole zbrisi ce ti neo vsec
						{
							//console.log("NE SLEDI!");
							_path = this.PathToWall();
						}
						else
						{
							for(var i=0;i<targets.length;i++)
							{
								_path = this.PathFinder(GAME.Players[targets[i]].CellOnFoot());
								if(_path.ok)
									break;
							}
							if(!_path.ok)
							{
								_path = this.PathToWall();
							}
							
						}
						this.player.AIStack = _path;//SHORTEN_PATH(this.PathFinder(GAME.Players[0].CellOnFoot()),3);
					}else{
						this.player.AIStack = this.SafePath();//SHORTEN_PATH(this.SafePath(),3);
						this.player.AIPlan = null;
					}
				}	
			}
			
			if(this.player.AIStack.type != AI_STACK_TYPE.DODGE  && this.player.AIStack.type != AI_STACK_TYPE.PICKUP)
			{
				var _path = this.PathToGoodPickUp();
				if(_path.ok && _path.path.length < 5)
				{
					this.player.AIStack = _path;
				}
			}
			//IF PICKUP && DIST < 5 (IF PICUP = TRUE CE NI GLAVA SMRTNA!)
				//AI_STACK.type = PICKUP
			//spodaj pol daj ce je TYPE.FOLLOW TE BO BOMBO NASTAVO (!= dodge -> ==follow)
			
			if(this.IsBlockClose() && this.player.AIStack.type != AI_STACK_TYPE.DODGE && this.player.AIStack.type != AI_STACK_TYPE.PICKUP   && this.NumberOfBombsHorAndVer()==0)
			{
				//IS BLOCK CLOSE MORE JAVIT TRUE CE JE V RAZDALJI NE SAMO BLOCK AMPAK TUDI SMRTNA GLAVA!!!!!!!!!!!!! TAK DA BO BOMBADIRO GLAVO!
				var _pos = this.player.CellOnFoot();
				var logicBomb = {x:_pos.x,y:_pos.y,bomb:{range:this.player.BombRange}};
				var out = this.SafePath(logicBomb); 
				
				if(out.ok && this.NoOfDifferentBombsDangerOnPath(out.path) == 0)//&& stack.length < 3 !
				{
					/*
					   THIS BOMB NEXT OT TILE AT JE LAHKO ZELO RANLJIV, KER BO CAKAL DOKLER NE BO MOGO POSTAVIT..... IZKLJUCI CE BO AI PREBUTAST ZA UPROABNIKE
						ISKANJE POTI ZA BLOCK ZE IZKORISCA TO METODO... TO JE PAC NEKI SAFETY
					*/
					if(this.__SafePathNoPoisonTile(logicBomb).ok) //&& !this.BombNextToTileAt(_pos.x+1,_pos.y) && !this.BombNextToTileAt(_pos.x-1,_pos.y) && !this.BombNextToTileAt(_pos.x,_pos.y+1) && !this.BombNextToTileAt(_pos.x,_pos.y-1))
						this.player.SetBomb();
				}
			}
			
			
		},
		GetRndTargetsArr: function()
		{
			var t = [];
			var r = [];
			var s=Math.floor(Math.random()*GAME.NumberOfPlayers);
			for(var i=0;i<GAME.NumberOfPlayers;i++)
			{
			   t.push((s+i)%GAME.NumberOfPlayers);
			}
			for(var i=0;i<t.length;i++)
			{
				if(GAME.Players[t[i]].id != this.player.id && !GAME.Players[t[i]].dead)
					r.push(t[i]);
			}
			return r;
		},
		BombNextToTileAt: function(x,y)
		{
			if(!MAP.IsWall(x,y))
				return false;
			return (MAP.BombsMatrix[y+1][x] != null || MAP.BombsMatrix[y-1][x] != null || MAP.BombsMatrix[y][x+1] != null || MAP.BombsMatrix[y][x-1] != null);
		},
		NoOfDifferentBombsDangerOnPath: function(path)
		{
			var bombs = this.getBombsArr();
			var c = 0;
			var check = new Array(bombs.length);
			for(var i=0;i<check.length;i++)
				check[i] = false;
			for(var i=0;i<path.length;i++)
			{
				for(var j=0;j<bombs.length;j++)
				{
					if(check[j])
						continue;
					if(this.EmulateBombDanger(path[i],bombs[j]))
					{
						check[j] = true;
						c++;
					}
				}
			}
			return c;
		},
		IsBlockClose: function()
		{
			
			var vectors = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
			var thispos = this.player.CellOnFoot();
			for(var i=0;i<vectors.length;i++)
			{
				var MAT = MAP.PowerUpMatrix[thispos.y + vectors[i].y][thispos.x + vectors[i].x];
				if(MAP.IsWall(thispos.x + vectors[i].x,thispos.y + vectors[i].y))
				{
					return true;
				}
				else if(MAT != null && MAT.type == MAP.PowerUpEnum.PENALTY)
				{
					return true;
				}
			}
			return false;
		},
		IsEnemyClose: function() //lahko not dodas distance! in samo vector * distance skaliras :)
		{
			var vectors = [{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
			var thispos = this.player.CellOnFoot();
			for(var i=0;i<GAME.NumberOfPlayers;i++)
			{
				if(GAME.Players[i].id != this.player.id && !GAME.Players[i].dead)
				{
					var fakeBomb = {x:thispos.x,y:thispos.y,bomb:{range:this.player.BombRange-1}};
					
					if(this.EmulateBombDanger(GAME.Players[i].CellOnFoot(),fakeBomb))
						return true;
					/*
					var pos = GAME.Players[i].CellOnFoot();
					for(var j=0;j<vectors.length;j++)
					{
						if(thispos.x+vectors[j].x == pos.x && thispos.y+vectors[j].y == pos.y)
							return true;
					}*/
					
				}
			}
			return false;
		},
		__SafePathNoPoisonTile : function(LogicalBomb)
		{
						LogicalBomb = typeof LogicalBomb !== 'undefined' ? LogicalBomb : {x:-1000,y:-1000,range:0}; //AI preverja ce lahko pobegne varno ce tu natavi bombo!
			//PAMETNO SE PREVERIT DA CE VSEENO NAJDE POT, KAK DALEC BO MOGO HODIT DA BO NASO POT! in te tut zavrnes... to naredi izven funkcije
			/*
			   POKLICI SE FUNKCIJO KI IZVEDE ISKANJE V SIRINO NAD DELI KI JE SAMO TRAVA, NI ZIDU, NI BOMBE, NI MOZNO DA SE OGENJ DOTAKNE
			   CE TA success: false izvedi slednje :)
			   else returnaj kr :)
			
			*/
			
			var pos = this.player.CellOnFoot();
			var queue = [{x:pos.x,y:pos.y,prev:null,len:0}];
			var done = MAP.Get2DArray(MAP.MapY,MAP.MapX);
			for(var y=0;y<MAP.MapY;y++)
				for(var x=0;x<MAP.MapX;x++)
					done[y][x] = false;
				
			done[pos.y][pos.x] = true;
			var found = null;
			var longest = null;
			var success = false;
			var ret = [];
			
			var MAT = MAP.PowerUpMatrix;


			
			
			
			while(queue.length!=0)
			{
				var tile = queue.shift();
				longest = tile;
				
				if(!this.BombDanger(tile,LogicalBomb) && (LogicalBomb.x != tile.x || LogicalBomb.y != tile.y) && (MAT[tile.y][tile.x] == null || (MAT[tile.y][tile.x] != null && MAT[tile.y][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					found = tile;
					success = true;
					break;
				}
				
				if(MAP.IsFloor(tile.x+1,tile.y) && !done[tile.y][tile.x+1] && MAP.BombsMatrix[tile.y][tile.x+1] == null && MAP.ExplosionMatrix[tile.y][tile.x+1] == null && (LogicalBomb.x != tile.x+1 || LogicalBomb.y !=tile.y) && (MAT[tile.y][tile.x+1] == null || (MAT[tile.y][tile.x+1] != null && MAT[tile.y][tile.x+1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x+1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x+1]=true;
				}
				if(MAP.IsFloor(tile.x-1,tile.y) && !done[tile.y][tile.x-1] && MAP.BombsMatrix[tile.y][tile.x-1] == null && MAP.ExplosionMatrix[tile.y][tile.x-1] == null && (LogicalBomb.x != tile.x-1 || LogicalBomb.y !=tile.y) && (MAT[tile.y][tile.x-1] == null || (MAT[tile.y][tile.x-1] != null && MAT[tile.y][tile.x-1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x-1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x-1]=true;
				}
				if(MAP.IsFloor(tile.x,tile.y+1) && !done[tile.y+1][tile.x] && MAP.BombsMatrix[tile.y+1][tile.x] == null && MAP.ExplosionMatrix[tile.y+1][tile.x] == null && (LogicalBomb.x != tile.x || LogicalBomb.y !=tile.y+1) && (MAT[tile.y+1][tile.x] == null || (MAT[tile.y+1][tile.x] != null && MAT[tile.y+1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y+1,prev:tile,len:1+tile.len});
					done[tile.y+1][tile.x]=true;
				}
				if(MAP.IsFloor(tile.x,tile.y-1) && !done[tile.y-1][tile.x] && MAP.BombsMatrix[tile.y-1][tile.x] == null && MAP.ExplosionMatrix[tile.y-1][tile.x] == null && (LogicalBomb.x != tile.x || LogicalBomb.y !=tile.y-1) && (MAT[tile.y-1][tile.x] == null || (MAT[tile.y-1][tile.x] != null && MAT[tile.y-1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y-1,prev:tile,len:1+tile.len});
					done[tile.y-1][tile.x]=true;
				}
			}
			
		
			
			if(found == null)
				found = longest;
			
			while(found != null)
			{
				ret.push(found);
				found = found.prev;
			}
			return {path:ret,ok:success,type:AI_STACK_TYPE.DODGE}; //returns ok==false if path is not correct
		},
		SafePath: function(LogicalBomb) //returns path where no bombs can reach you!
		{
			var preTest = this.__SafePathNoPoisonTile(LogicalBomb);
			if(preTest.ok)
				return preTest;
			
			
			LogicalBomb = typeof LogicalBomb !== 'undefined' ? LogicalBomb : {x:-1000,y:-1000,range:0}; //AI preverja ce lahko pobegne varno ce tu natavi bombo!
			//PAMETNO SE PREVERIT DA CE VSEENO NAJDE POT, KAK DALEC BO MOGO HODIT DA BO NASO POT! in te tut zavrnes... to naredi izven funkcije
			/*
			   POKLICI SE FUNKCIJO KI IZVEDE ISKANJE V SIRINO NAD DELI KI JE SAMO TRAVA, NI ZIDU, NI BOMBE, NI MOZNO DA SE OGENJ DOTAKNE
			   CE TA success: false izvedi slednje :)
			   else returnaj kr :)
			
			*/
			
			var pos = this.player.CellOnFoot();
			var queue = [{x:pos.x,y:pos.y,prev:null,len:0}];
			var done = MAP.Get2DArray(MAP.MapY,MAP.MapX);
			for(var y=0;y<MAP.MapY;y++)
				for(var x=0;x<MAP.MapX;x++)
					done[y][x] = false;
				
			done[pos.y][pos.x] = true;
			var found = null;
			var longest = null;
			var success = false;
			var ret = [];
			while(queue.length!=0)
			{
				var tile = queue.shift();
				longest = tile;
				
				if(!this.BombDanger(tile,LogicalBomb) && (LogicalBomb.x != tile.x || LogicalBomb.y != tile.y))
				{
					found = tile;
					success = true;
					break;
				}
				
				if(MAP.IsFloor(tile.x+1,tile.y) && !done[tile.y][tile.x+1] && MAP.BombsMatrix[tile.y][tile.x+1] == null && MAP.ExplosionMatrix[tile.y][tile.x+1] == null && (LogicalBomb.x != tile.x+1 || LogicalBomb.y !=tile.y))
				{
					queue.push({x:tile.x+1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x+1]=true;
				}
				if(MAP.IsFloor(tile.x-1,tile.y) && !done[tile.y][tile.x-1] && MAP.BombsMatrix[tile.y][tile.x-1] == null && MAP.ExplosionMatrix[tile.y][tile.x-1] == null && (LogicalBomb.x != tile.x-1 || LogicalBomb.y !=tile.y))
				{
					queue.push({x:tile.x-1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x-1]=true;
				}
				if(MAP.IsFloor(tile.x,tile.y+1) && !done[tile.y+1][tile.x] && MAP.BombsMatrix[tile.y+1][tile.x] == null && MAP.ExplosionMatrix[tile.y+1][tile.x] == null && (LogicalBomb.x != tile.x || LogicalBomb.y !=tile.y+1))
				{
					queue.push({x:tile.x,y:tile.y+1,prev:tile,len:1+tile.len});
					done[tile.y+1][tile.x]=true;
				}
				if(MAP.IsFloor(tile.x,tile.y-1) && !done[tile.y-1][tile.x] && MAP.BombsMatrix[tile.y-1][tile.x] == null && MAP.ExplosionMatrix[tile.y-1][tile.x] == null && (LogicalBomb.x != tile.x || LogicalBomb.y !=tile.y-1))
				{
					queue.push({x:tile.x,y:tile.y-1,prev:tile,len:1+tile.len});
					done[tile.y-1][tile.x]=true;
				}
			}
			
		
			
			if(found == null)
				found = longest;
			
			while(found != null)
			{
				ret.push(found);
				found = found.prev;
			}
			return {path:ret,ok:success,type:AI_STACK_TYPE.DODGE}; //returns ok==false if path is not correct
		},
		BombDanger:function(pos,LogicalBomb)
		{
			
			var bombs = this.getBombsArr();
			if(typeof LogicalBomb !== 'undefined')
			{
				if(LogicalBomb.x > -1 && LogicalBomb.y > -1)
					bombs.push(LogicalBomb);
			}
			if(bombs.length == 0) // to ni vredi ker ko bomba pokne izgine in se je vseeno flame gor!
				return false;
			
			for(var i=0;i<bombs.length;i++)
			{
				if(this.EmulateBombDanger(pos,bombs[i]))
					return true;
				/*
				var diffX = bombs[i].x - pos.x;
				var diffY = bombs[i].y - pos.y;
				if(bombs[i].x == pos.x && bombs[i].bomb.range >= Math.abs(diffY) ) //&& NO Walls interfier! NUJNO KER CE DAS BOMBO x[nelomljiv]player bo zaznal da ga lahko kdo spece...
				{
					return true;
				}
				else if(bombs[i].y == pos.y && bombs[i].bomb.range >= Math.abs(diffX))
				{
					return true;
				}*/
			}
			return false;
		},
		EmulateBombDanger:function(target,bombloc)
		{
			var bombs = bombloc;
			var pos = target;
			//MapStatusEnum: Object.freeze({SOLID_BORDER: 1, SOLID_WALL: 2, WALL:3, FLOOR: 4}),
			
			var tmp = {x: bombloc.x, y: bombloc.y};
			for(var i=0;i<bombs.bomb.range;i++)
			{
				var bx = tmp.x+i;
				var by = tmp.y;
				if(!MAP.IsFloor(bx,by))
					break;
				if(pos.x == bx && pos.y == by)
					return true;
			}
			for(var i=0;i<bombs.bomb.range;i++)
			{
				var bx = tmp.x-i;
				var by = tmp.y;
				if(!MAP.IsFloor(bx,by))
					break;
				if(pos.x == bx && pos.y == by)
					return true;
			}
			for(var i=0;i<bombs.bomb.range;i++)
			{
				var bx = tmp.x;
				var by = tmp.y+i;
				if(!MAP.IsFloor(bx,by))
					break;
				if(pos.x == bx && pos.y == by)
					return true;
				
			}
			for(var i=0;i<bombs.bomb.range;i++)
			{
				var bx = tmp.x;
				var by = tmp.y-i;
				if(!MAP.IsFloor(bx,by))
					break;
				if(pos.x == bx && pos.y == by)
					return true;
			}
			return false;
		},
		PathFinder: function(end)
		{
			var pos = this.player.CellOnFoot();
			var queue = [{x:pos.x,y:pos.y,prev:null,len:0}];
			var done = MAP.Get2DArray(MAP.MapY,MAP.MapX);
			for(var y=0;y<MAP.MapY;y++)
				for(var x=0;x<MAP.MapX;x++)
					done[y][x] = false;
				
			done[pos.y][pos.x] = true;
			var found = null;
			var longest = null;
			var success = false;
			var ret = [];
			var MAT = MAP.PowerUpMatrix;
			while(queue.length!=0)
			{
				var tile = queue.shift();
				var isWay = false;
				
				if(tile.x == end.x && tile.y == end.y)
				{
					found = tile;
					success = true;
					break;
				}
				
				if(MAP.IsFloor(tile.x+1,tile.y) && !done[tile.y][tile.x+1] && !this.BombDanger({x:tile.x+1,y:tile.y}) && (MAT[tile.y][tile.x+1] == null || (MAT[tile.y][tile.x+1] != null && MAT[tile.y][tile.x+1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x+1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x+1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x-1,tile.y) && !done[tile.y][tile.x-1] && !this.BombDanger({x:tile.x-1,y:tile.y}) && (MAT[tile.y][tile.x-1] == null || (MAT[tile.y][tile.x-1] != null && MAT[tile.y][tile.x-1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x-1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x-1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y+1) && !done[tile.y+1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y+1}) && (MAT[tile.y+1][tile.x] == null || (MAT[tile.y+1][tile.x] != null && MAT[tile.y+1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y+1,prev:tile,len:1+tile.len});
					done[tile.y+1][tile.x]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y-1) && !done[tile.y-1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y-1}) && (MAT[tile.y-1][tile.x] == null || (MAT[tile.y-1][tile.x] != null && MAT[tile.y-1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y-1,prev:tile,len:1+tile.len});
					done[tile.y-1][tile.x]=true;
					isWay = true;
				}
				if(!isWay && longest == null) //najkrajsa pot je resitev
				{
					longest = tile;
				}
			}
			
		
			
			if(found == null)
				found = longest;
			
			while(found!=null)//(found.prev != null)
			{
				ret.push(found);
				found = found.prev;
			}

			return {path:ret,ok:success,type:AI_STACK_TYPE.FOLLOW}; //returns ok==false if path is not correct
			
		},
		PathToGoodPickUp : function()
		{
			var pos = this.player.CellOnFoot();
			var queue = [{x:pos.x,y:pos.y,prev:null,len:0}];
			var done = MAP.Get2DArray(MAP.MapY,MAP.MapX);
			for(var y=0;y<MAP.MapY;y++)
				for(var x=0;x<MAP.MapX;x++)
					done[y][x] = false;
				
			done[pos.y][pos.x] = true;
			var found = null;
			var longest = null;
			var success = false;
			var ret = [];
			var MAT = MAP.PowerUpMatrix;
			while(queue.length!=0)
			{
				var tile = queue.shift();
				var isWay = false;
				
				if((MAT[tile.y][tile.x] != null && MAT[tile.y][tile.x].type != MAP.PowerUpEnum.PENALTY))
				{
					found = tile;
					success = true;
					break;
				}
				
			
				if(MAP.IsFloor(tile.x+1,tile.y) && !done[tile.y][tile.x+1] && !this.BombDanger({x:tile.x+1,y:tile.y}) && (MAT[tile.y][tile.x+1] == null || (MAT[tile.y][tile.x+1] != null && MAT[tile.y][tile.x+1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x+1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x+1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x-1,tile.y) && !done[tile.y][tile.x-1] && !this.BombDanger({x:tile.x-1,y:tile.y}) && (MAT[tile.y][tile.x-1] == null || (MAT[tile.y][tile.x-1] != null && MAT[tile.y][tile.x-1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x-1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x-1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y+1) && !done[tile.y+1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y+1}) && (MAT[tile.y+1][tile.x] == null || (MAT[tile.y+1][tile.x] != null && MAT[tile.y+1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y+1,prev:tile,len:1+tile.len});
					done[tile.y+1][tile.x]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y-1) && !done[tile.y-1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y-1}) && (MAT[tile.y-1][tile.x] == null || (MAT[tile.y-1][tile.x] != null && MAT[tile.y-1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y-1,prev:tile,len:1+tile.len});
					done[tile.y-1][tile.x]=true;
					isWay = true;
				}
				if(!isWay && longest == null) //najkrajsa pot je resitev
				{
					longest = tile;
				}
			}
			

			
			if(found == null)
				found = longest;
			
			while(found!=null)//(found.prev != null)
			{
				ret.push(found);
				found = found.prev;
			}

			return {path:ret,ok:success,type:AI_STACK_TYPE.PICKUP}; //returns ok==false if path is not correct
			
		},
		PathToWall: function()
		{
			var pos = this.player.CellOnFoot();
			var queue = [{x:pos.x,y:pos.y,prev:null,len:0}];
			var done = MAP.Get2DArray(MAP.MapY,MAP.MapX);
			for(var y=0;y<MAP.MapY;y++)
				for(var x=0;x<MAP.MapX;x++)
					done[y][x] = false;
				
			done[pos.y][pos.x] = true;
			var found = null;
			var longest = null;
			var success = false;
			var ret = [];
			var MAT = MAP.PowerUpMatrix;
			while(queue.length!=0)
			{
				var tile = queue.shift();
				var isWay = false;
				
				if((MAP.IsWall(tile.x-1,tile.y) || MAP.IsWall(tile.x+1,tile.y) || MAP.IsWall(tile.x,tile.y-1) || MAP.IsWall(tile.x,tile.y+1)) && (MAT[tile.y][tile.x] == null || (MAT[tile.y][tile.x] != null && MAT[tile.y][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					if(!this.BombNextToTileAt(tile.x+1,tile.y) && !this.BombNextToTileAt(tile.x-1,tile.y) && !this.BombNextToTileAt(tile.x,tile.y+1) && !this.BombNextToTileAt(tile.x,tile.y-1))
					{
						found = tile;
						success = true;
						break;
					}
				}
				
			
				if(MAP.IsFloor(tile.x+1,tile.y) && !done[tile.y][tile.x+1] && !this.BombDanger({x:tile.x+1,y:tile.y}) && (MAT[tile.y][tile.x+1] == null || (MAT[tile.y][tile.x+1] != null && MAT[tile.y][tile.x+1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x+1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x+1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x-1,tile.y) && !done[tile.y][tile.x-1] && !this.BombDanger({x:tile.x-1,y:tile.y}) && (MAT[tile.y][tile.x-1] == null || (MAT[tile.y][tile.x-1] != null && MAT[tile.y][tile.x-1].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x-1,y:tile.y,prev:tile,len:1+tile.len});
					done[tile.y][tile.x-1]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y+1) && !done[tile.y+1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y+1}) && (MAT[tile.y+1][tile.x] == null || (MAT[tile.y+1][tile.x] != null && MAT[tile.y+1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y+1,prev:tile,len:1+tile.len});
					done[tile.y+1][tile.x]=true;
					isWay = true;
				}
				if(MAP.IsFloor(tile.x,tile.y-1) && !done[tile.y-1][tile.x] && !this.BombDanger({x:tile.x,y:tile.y-1}) && (MAT[tile.y-1][tile.x] == null || (MAT[tile.y-1][tile.x] != null && MAT[tile.y-1][tile.x].type != MAP.PowerUpEnum.PENALTY)))
				{
					queue.push({x:tile.x,y:tile.y-1,prev:tile,len:1+tile.len});
					done[tile.y-1][tile.x]=true;
					isWay = true;
				}
				if(!isWay && longest == null) //najkrajsa pot je resitev
				{
					longest = tile;
				}
			}
			

			
			if(found == null)
				found = longest;
			
			while(found!=null)//(found.prev != null)
			{
				ret.push(found);
				found = found.prev;
			}

			return {path:ret,ok:success,type:AI_STACK_TYPE.FOLLOW}; //returns ok==false if path is not correct
			
		},
		getBombsArr: function()
		{
			var bombs = [];
			for(var y=0;y<MAP.MapY;y++)
			{
				for(var x=0;x<MAP.MapX;x++)
				{
					if(MAP.BombsMatrix[y][x] != null)
					{
						bombs.push({bomb:MAP.BombsMatrix[y][x],x:x,y:y});
					}
				}
			}
			return bombs;
		},
		


		
	};
}