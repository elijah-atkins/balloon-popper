import { AudioListener, Audio, PositionalAudio, AudioLoader } from '../../libs/three/three.module.js';

class SFX {
    constructor(camera, assetsPath, listener) {
        if (listener) {
            this.listener = listener;
        } else {
            this.listener = new AudioListener();
            camera.add(this.listener);
        }

        this.assetsPath = assetsPath;
        this.sounds = {};
    }

    loadSound(name, loop=false, volume=0.5, object=null, position=null) {
        //create a global audio source with positional audio
        const sound = new Audio(this.listener);
        
        this.sounds[name] = sound;

        const audioLoader = new AudioLoader();
        audioLoader.load( 'assets/sounds/' + name + '.mp3', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( loop );
            sound.setVolume( volume );
        });
    }

    setVolume(name, volume) {
        const sound = this.sounds[name];

        if(sound) {
            sound.setVolume(volume);
        }
    }

    //set loop
    setLoop(name, loop) {
        const sound = this.sounds[name];

        if(sound) {
            sound.setLoop(loop);
        }
    }

    //play sound
    play(name) {
        const sound = this.sounds[name];
        if(sound) {

            sound.play();
        }
    }

    //stop sound
    stop(name) {
        const sound = this.sounds[name];

        if(sound) {
            sound.stop();
        }
    }   
    //stop all sounds
    stopAll() {
        for(const name in this.sounds) {
            this.stop(name);
        }
    }
    //pause sound
    pause(name) {
        const sound = this.sounds[name];

        if(sound) {
            sound.pause();
        }
    }
}

export { SFX };
