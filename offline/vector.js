function getVectorAB(A,B)
{
  return {X:B.X-A.X, Y:B.Y-A.Y};
}
function Vector2(x,y)
{
  return {X:x,Y:y};
}
function CrossProductVec(V1,V2)
{
  return V1.X*V2.Y - V2.X*V1.Y;
}
function ScalarVec(V1,V2)
{
  return V1.X*V2.X+V1.Y*V2.Y;
}
function VectorAngle(V1,V2)
{
  return Math.acos(ScalarVec(V1,V2)/(Math.sqrt(ScalarVec(V1,V1))*Math.sqrt(ScalarVec(V2,V2))));
}
function VectorAngleToDeg(angle)
{
  return angle*(180.0/Math.PI);
}
function toDeg(rad)
{
	return rad * (180.0/Math.PI);
}
function toRad(deg)
{
	return deg * (Math.PI/180.0);
}
function getDistance(P1,P2)
{
  return ((P1.X-P2.X)*(P1.X-P2.X))+((P1.Y-P2.Y)*(P1.Y-P2.Y));
}
function getCentroid(A,B,C) //tezisce trikotnika s 3 krajevnimi vektorji
{
	return {X: (A.X+B.X+C.X)/3.0, Y:(A.Y+B.Y+C.Y)/3.0};
}
function getDegAngle(P1,P2)
{
	var angle = Math.atan2(P2.Y - P1.Y, P2.X - P1.X) * (180.0 / Math.PI);
	if(angle<0)
	  return angle+360;
	return angle;
}
function getRadAngle(P1,P2)
{
	return Math.atan2(P2.Y - P1.Y, P2.X - P1.X);
}
function rotateDeg(v,deg)
{
	    var rad = deg*(Math.PI/180.0); //to rad!
		var ca = Math.cos(rad);
        var sa = Math.sin(rad);
        return {X:ca*v.X - sa*v.Y,Y:sa*v.X + ca*v.Y};
}
function rotate(v,rad)
{
	var ca = Math.cos(rad);
    var sa = Math.sin(rad);
	return {X:ca*v.X - sa*v.Y,Y:sa*v.X + ca*v.Y};
}
function vectorPlus(v1,v2)
{
	return {X:v1.X+v2.X,Y:v1.Y+v2.Y};
}
function scaleVector(v,scale)
{
	return {X:v.X*scale,Y:v.Y*scale};
}
function getABCArea(A,B,C) //vrne poloscino
{
	return 0.5*Math.abs(A.X*(B.Y-C.Y)+B.X*(C.Y-A.Y)+C.X*(A.Y-B.Y));
}
function vecLen(vec)
{
  return Math.sqrt(vec.X*vec.X+vec.Y*vec.Y);
}