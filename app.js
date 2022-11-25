import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';


class App {
    //color array with 10 colors. Red, pink, light green, dark green, light blue, dark blue, yellow, orange, purple, magenta
    colors = [0xff0000, 0xff707b, 0x30ee30, 0x006400, 0x66bbe6, 0x0000ff, 0xffff00, 0xffa500, 0x800080, 0xff00ff];
    constructor() {
        const scorePanel = document.getElementById("score");
        this.gameOver = true;
        this.score = 0;
        this.lives = 0;

        //update the score

        scorePanel.innerHTML = "Score: " + this.score;
        const container = document.createElement('div');
        document.body.appendChild(container);
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 50);
        this.camera.position.set(-10, 0, 20);
        this.camera.lookAt(-6, 4, 0);
        this.timer = new THREE.Clock();
        this.scene = new THREE.Scene();



        const ambient = new THREE.HemisphereLight(0xffffff, 0x666666, 0.3);

        this.scene.add(ambient);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        this.setEnvironment();
        //set the background color to hdri
        this.renderer.setClearColor(0x000000, 0);
        //add the renderer to the container
        container.appendChild(this.renderer.domElement);

        //Add code here
        this.loadingBar = new LoadingBar();
        this.loadGLTF()
        //add 5 instances of setBalloon
        for (let i = 10; i > 0; i--) {
            this.loadGLTF(i);
        }

        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('resize', this.resize.bind(this));
        //event listener for the start button
        const startButton = document.getElementById("start");
        startButton.addEventListener('click', this.newGame.bind(this));

    }
    //hide all balloons
    hideAll() {
        for (let i = 0; i < this.scene.children.length; i++) {
            this.scene.children[i].visible = false;
        }
        //show the start button
        const startButton = document.getElementById("start");
        startButton.style.visibility = "visible";
    }

    //show all
    showAll() {
        for (let i = 0; i < this.scene.children.length; i++) {
            this.scene.children[i].visible = true;
            //subtract 10 from y position if the balloon is over 5
            if (this.scene.children[i].position.y > 0) {
                this.scene.children[i].position.y -= 25;
            }
        }
        //hide the start button
        const startButton = document.getElementById("start");
        startButton.style.visibility = "hidden";
    }

    newGame() {
        this.gameOver = false;
        this.setLives(5);
        this.setScore(0);
        this.showAll();
    }

    setScore(s) {
        this.score = s;
        const scorePanel = document.getElementById("score");
        scorePanel.innerHTML = "Score: " + this.score;
    }

    setLives(l) {
        this.lives = l;
        if (this.lives === 0) {
            this.hideAll();
            this.gameOver = true;

        }
        const livesPanel = document.getElementById("lives");
        livesPanel.innerHTML = "Lives: " + this.lives;
    }


    onClick(event) {
        if (!this.gameOver) {
            //get the mouse position
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            //create a raycaster
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            //get the objects that the raycaster intersects
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            //if there is an intersection, reset the balloon position
            if (intersects.length > 0) {
                this.resetBalloon(intersects[0].object.parent);
                this.score += 1;
                this.setScore(this.score);
                //console log the position of the balloon
          //      console.log(intersects[0].object.parent.position);
            }
        }
        
    }


    setEnvironment() {
        const loader = new RGBELoader().setDataType(THREE.UnsignedByteType);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        loader.load('../../assets/hdr/field_sky.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();

            self.scene.environment = envMap;

        }, undefined, (err) => {
            console.error('An error occurred setting the environment');
        });
    }



    loadGLTF() {
        //new random color
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        // new material with random color
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.1,
            metalness: 0.1,
            opacity: 0.9,
            transparent: true
        });

        const self = this;
        const loader = new GLTFLoader().setPath('../../assets/');
        loader.load('balloon.glb', function (gltf) {
            self.balloon = gltf.scene;

            self.scene.add(gltf.scene);
            self.loadingBar.visible = false;

            self.renderer.setAnimationLoop(self.render.bind(self));
            //reset the balloon 
            //add material to the balloon
            self.balloon.traverse((o) => {
                if (o.isMesh) {
                    o.material = material;
                }
            });
            //get balloon index
            const index = self.scene.children.indexOf(self.balloon);
            self.balloon.position.set(Math.sin(index * 5) * 10 - 5, -Math.sin(index) * 10 - 15, Math.cos(index * 3) * 10 - 5);
            self.balloon.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);


        },
            function (xhr) {
                self.loadingBar.progress = xhr.loaded / xhr.total;
            },
            undefined, function (e) {
                console.error(e);
                console.log('An error happened');
            });
    }
    //reset balloon position to random position and random color
    resetBalloon(balloon) {
        balloon.visible = false;
        let frame = this.timer.getElapsedTime();
        const index = this.scene.children.indexOf(this.balloon);
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        balloon.position.set(Math.sin(index + frame * 5) * 10 - 5, -Math.sin(index + frame * 10) * 10 - 25, 0);
        const s = Math.random() * 0.25 + 0.75;
        balloon.scale.set(s, s, s);
        //set the balloon color
        balloon.traverse((o) => {
            if (o.isMesh) {
                o.material.color.set(color);
                o.material.roughness = 0.1;
                o.material.metalness = 0.1;
            }
        });
        balloon.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        balloon.visible = true;
    }


    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


    render() {
        //find every child of the scene and rotate it
        if (!this.gameOver) {
            this.scene.children.forEach((child) => {
                child.position.y += 0.05;
                child.rotation.y += Math.sin(child.position.y * 1) * 0.01;
                child.rotation.z += .01;
                if (child.position.y > 20) {
                    //reset the balloon

                    this.resetBalloon(child);
                    //if the position.x in in view, subtract 1 from the score
                    if (child.position.x > -3 && child.position.x < 3) {
                        //if the balloon is visible, subtract 1 from the score
                        if (child.visible) {
                            this.lives -= 1;
                            this.setLives(this.lives);
                        }
                    }
                }
                //check for collision
                if (this.checkCollision(child)) {
                    //bump the balloon
                    this.bumpBalloon(child);
                }

            });


            this.renderer.render(this.scene, this.camera);
        }
    }
    //check for collision

    checkCollision(balloon) {
        const index = this.scene.children.indexOf(balloon);
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].visible) {
                if (i != index) {
                    if (this.scene.children[i].position.distanceTo(balloon.position) < 2) {
                        //return true if there is a collision
                        return true;
                    }
                }
            }
        }
        //return false if there is no collision
        return false;
    }

    //check for collisions bump the balloon up at a random angle
    bumpBalloon(balloon) {
        //get a random angle
        const angle = Math.random() * 2 * Math.PI;
        //get a random distance
        const distance = Math.random() * 2 + 1;
        //move the balloon up
        balloon.position.y += distance;
        //move the balloon along the angle
        balloon.position.x += Math.cos(angle) * distance;
        balloon.position.z += Math.sin(angle) * distance;
    }


}

export { App };