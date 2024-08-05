import zim from "https://zimjs.org/cdn/016/zim_three";
import phy from "https://zimjs.org/cdn/016/zim_physics";

// see https://zimjs.com
// and https://zimjs.com/learn
// and https://zimjs.com/docs

new Frame(FIT, 3000, 500, black, black, ready, ["maze.png", "gf_Fascinate+Inline"], "https://assets.codepen.io/2104200/");
function ready() {
	
	// given F (Frame), S (Stage), W (width), H (height)
	// put code here

	// Message - TextureActive to show Title and Button
	// Parameters:
	// width, height, color, color2, angle, borderColor, borderWidth, corner, interactive, animated, backingOrbit, pattern, scalePattern
	const message = new TextureActive({color:black, width:400, height:90});

	new Label("RING MAZE", 40, "Fascinate Inline", pink).pos(0,0,CENTER,TOP,message);
	const button = new Button({label:"PLAY", corner:6}).sca(.5).pos(0,0,CENTER,BOTTOM,message).tap(()=>{		
		button.removeFrom();
		timeout(1, ()=>{
			ball.dynamic = true
		})
	});
	STYLE = {once:true, italic:true, bold:true}
	const win = new Label("CONGRATULATIONS",20,null,yellow)
		.reg(CENTER)
		.pos(0,0,CENTER,BOTTOM,message)
		.cache()
		.sca(0);
	
	// ZIM Link
	const madeWith = new TextureActive(400,300,black).addTo();
    TextureActive
		.makeBacking(madeWith.width, madeWith.height, "")
		.addTo(madeWith)
		.tap(()=>{zgo("https://zimjs.com/studio", "_blank")});
	
	
	// Cylinder wall
	const wall = new TextureActive({color:black, width:W, height:H, corner:0});

	// we do not want the content to get in the way of the OrbitControls
	// so easiest to add to container and set noMouse() - we can still track mouse position in Ticker
	const holder = new Container(W,H).addTo(wall).noMouse();
	
	// MAZE
	// we can load in ANY picture of a maze as long as the walls are different than the backing
	// we could even load two pictures... a hidden one to represent the walls and a visual more complex one
	// we then use physics to apply a force to the ball to follow the mouse
	// and we make physic walls dynamically around the ball's position
	// the walls are placed only on the non-background color
	// the walls are removed as the ball leaves the area and new ones are made

	// thanks https://www.mazegenerator.net/ 
	// note: we made a vertical maze to start at the top and bottom 
	// then rotated the image to start at the sides
	var maze = new Pic("maze.png").addTo(holder).cache();
	// cache the image so we have a second canvas to use later
	// this allows us to get the color of the pixel under the ball
	// without getting the color of the ball ;-)

	new Label("START",25,null,white).pos(90,-20,LEFT,CENTER,holder);
	new Label("END",25,null,white).pos(60,-20,RIGHT,CENTER,holder);

	new Rectangle(W,H,new GradientColor([blue,green,orange,yellow])).addTo(holder).ble("darken");

	// create a Physics instance to handle making the ball bounce off walls
	// we will make walls dynamically only in the area of the ball
	// that way we don't make thousands of walls that we don't need
	// use the default outer walls and set gravity to 0
	var physics = new Physics(0);

	var ball = new Circle(8, purple).loc(130,262,holder).addPhysics(false, 2);
	// add an optional little finder
	new Circle(30,white.toAlpha(.3)).center(ball,0).wiggle("scale",1,.1,.2,.7,1.5);

	const end = new Rectangle(50,22,faint).pos(33,13,RIGHT,CENTER,holder)

	// create a Ticker to constantly apply a force to the ball
	// and make the walls near the ball
	// the factor is for the force
	// balance the speed with a tendency to go through walls if too fast

	const emitter = new Emitter({
		startPaused:true,
		obj:new Circle(ball.radius*1.3,clear,purple,3),
		animation:{scale:{min:.5, max:1.5}},
		force:{min:.5, max:1.5},
		gravity:0
	}).addTo(holder);

	var factor = .005; // force is incremental in time (make small)
	var max = .5; // limit the mouse distance (which limits force)
	Ticker.add(function() {
		// make the walls
		makeWalls();

		// apply a force towards the mouse
		// do not use stage.mouseX and stage.mouseY
		// as they do not catch touch location
		// use any mouse event's mouseX and mouseY instead
		// we did that and stored the values in mouseX and mouseY
		var dX = constrain((F.mouseX-ball.x)*factor, -max, max);
		var dY = constrain((F.mouseY-ball.y)*factor, -max, max);
		ball.force(dX, dY);

		if (ball.hitTestBounds(end)) {
			emitter.loc(ball).spurt(20);
			ball.dynamic = false;
			ball.vis(false);
			ball.body.loc(150,262);
			win.animate({
				wait:.8,
				time:1.2,
				props:{scale:1},
				rewind:true,
				ease:"elasticOut"
			})
			timeout(3.5, ()=>{
				ball.dynamic = true;
				ball.vis(true);
				emitter.loc(ball).spurt(20);
			});
			
		}
	});

	
	// we want to find the color of the maze picture around where the ball is
	// we will put a wall at anywhere that is not the background color
	// so we access the context 2D of the cached picture
	var ctx = maze.cacheCanvas.getContext('2d');

	var num = 20; // test a 10x10 grid around the ball
	var space = 1; // the spacing of the points on the grid
	var radius = 1; // the radius of a wall placed at a point
	var walls = []; // an array to keep track of the active walls

	function makeWalls() {

		// remove any walls from the last time
		loop(walls, function(wall) {
			physics.remove(wall);
		});
		walls = [];

		// loop through our grid
		loop(num, i=> {
			loop(num, j=> {

				// locate the x and y point on the grid for this i,j index
				var x = ball.x - num / 2 * space + i*space;
				var y = ball.y - num / 2 * space + j*space;

				// get the color data of the pixel at this grid location
				var data = ctx.getImageData(x, y, 1, 1).data;

				// Physics lets you automatically map physics bodies to ZIM objects
				// but in this case, we do not need visual objects
				// and we are creating many objects - so do not make the ZIM objects
				// Physics has methods to add only physics objects
				// so this is what we do in this case

				// make the wall if the color is darker than the background color
				if (data[0] < 150) {
					let wall = physics.makeCircle(radius, false);
					wall.x = x;
					wall.y = y;
					// add the wall to our array of walls
					walls.push(wall);
				}
			});
		});
	}


	// ~~~~~~~~~~~~~~~~~~~~~~~
    // THREEJS
   
    const three = new Three({
        width:window.innerWidth, 
        height:window.innerHeight, 
        cameraPosition:new THREE.Vector3(0,-.1,6.5), // this is VR settings
        textureActive:true
    });

    const renderer = three.renderer;
    const scene = three.scene;
    const camera = three.camera;
    const canvas = three.canvas;
    const controls = new OrbitControls(camera, canvas);
	controls.rotateSpeed *= -.5; // seem to want to drag the maze - so reversed normal rotation
	controls.enableDamping = true;
	controls.dampingFactor = 0.1;
    three.preRender = ()=>{controls.update();}


    // TEXTUREACTIVES
    // more options - see https://zimjs.com/docs.html?item=TextureActives
    // only have ONE TextureActives object but there may be more than one TextureActive objects
    // use an array for the first parameter here if there is more than one TextureActive object
    // use the layer parameter so VR controls do not get in the way
	// physics needs to be first so it stays at 0,0 in ZIM.
    const textureActives = new TextureActives([wall, message, madeWith], THREE, three, renderer, scene, camera, controls);

    // To remove T key which toggles between 2D and 3D uncomment this:
    // textureActives.manager.toggleKey = -1;

	// if the object is a plane then we can use the makePanel of the ZIM Three helper
	const canvasWindow = three.makePanel({
        textureActive:message, 
        textureActives:textureActives, 
		scale:.03,
        curve:2 
    });
    scene.add(canvasWindow);  	
	canvasWindow.position.y = 5
	canvasWindow.position.z = -7

	// if the object is not a plane then we use the CanvasTexture
	// and this gets passed the canvas property of the ZIM TextureActive
	// note - the box will get the interactive texture on all sides which is okay
	// but here, we make the texture only on the front of the box
	const cylinderGeometry = new THREE.CylinderGeometry(10, 10, 10, 50);
	const cylinderTexture = new THREE.CanvasTexture(wall.canvas);
	const cylinderMaterial = [
		// backside of cylinder is flipped so flip back using ZIM three helper module method
		three.flipMaterial(THREE.MeshBasicMaterial, {map:cylinderTexture, side:THREE.BackSide}),
		new THREE.MeshBasicMaterial({transparent:true, opacity:0}),
		new THREE.MeshBasicMaterial({transparent:true, opacity:0})
	];
	const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);           
	cylinder.rotation.y = 180*RAD;
	scene.add(cylinder);
	textureActives.addMesh(cylinder);
	
	
	const zimLink = three.makePanel({
        textureActive:madeWith, 
        textureActives:textureActives, 
		scale:.015,
        curve:.5 
    });
    scene.add(zimLink);  	
	zimLink.position.y = -5
	zimLink.position.z = -9


	// THROTTLE TEST
    // on some older mobiles updating the cache constantly can bog at 60 fps
    let fps; const fpsT = Ticker.add(()=>{fps = Ticker.getFPS();});
    timeout(2, ()=>{if (fps < 50) {Ticker.setFPS(30);}; Ticker.remove(fpsT);});
		
}

// Docs for items used:
// https://zimjs.com/docs.html?item=Frame
// https://zimjs.com/docs.html?item=Pic
// https://zimjs.com/docs.html?item=Container
// https://zimjs.com/docs.html?item=Circle
// https://zimjs.com/docs.html?item=Rectangle
// https://zimjs.com/docs.html?item=Label
// https://zimjs.com/docs.html?item=Button
// https://zimjs.com/docs.html?item=tap
// https://zimjs.com/docs.html?item=noMouse
// https://zimjs.com/docs.html?item=addPhysics
// https://zimjs.com/docs.html?item=hitTestBounds
// https://zimjs.com/docs.html?item=animate
// https://zimjs.com/docs.html?item=wiggle
// https://zimjs.com/docs.html?item=loop
// https://zimjs.com/docs.html?item=pos
// https://zimjs.com/docs.html?item=loc
// https://zimjs.com/docs.html?item=ble
// https://zimjs.com/docs.html?item=reg
// https://zimjs.com/docs.html?item=sca
// https://zimjs.com/docs.html?item=addTo
// https://zimjs.com/docs.html?item=removeFrom
// https://zimjs.com/docs.html?item=center
// https://zimjs.com/docs.html?item=TextureActive
// https://zimjs.com/docs.html?item=TextureActives
// https://zimjs.com/docs.html?item=Emitter
// https://zimjs.com/docs.html?item=Physics
// https://zimjs.com/docs.html?item=timeout
// https://zimjs.com/docs.html?item=constrain
// https://zimjs.com/docs.html?item=GradientColor
// https://zimjs.com/docs.html?item=toAlpha
// https://zimjs.com/docs.html?item=STYLE
// https://zimjs.com/docs.html?item=Ticker