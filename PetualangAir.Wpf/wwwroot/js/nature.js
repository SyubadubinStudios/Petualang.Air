import * as THREE from 'three';
export class NaturalDetails {
    constructor(root, biome) {
        this.root = new THREE.Group(); root.add(this.root); this.time = { value: 0 };
        this.biome = biome; this.textures = [];
        if (biome === 'SamudraLepas') { this.addBirds(); return; }
        this.addShoreline(); this.addBirds();
    }
    addShoreline() {
        const b = this.biome;
        const colors = b === 'HutanGambut' ? [0x3b5730,0x698242] : [0x4a722e,0x819246];
        const leafGeo = new THREE.PlaneGeometry(.8, 3, 1, 4); const p = leafGeo.attributes.position;
        for(let i=0;i<p.count;i++){const y=p.getY(i)+1.5; p.setX(i,p.getX(i)*Math.sin(Math.PI*y/3));p.setZ(i,.22*y*y);p.setY(i,y);}
        leafGeo.computeVertexNormals();
        const material = new THREE.MeshStandardMaterial({color: colors[0],roughness:.85,side:THREE.DoubleSide});
        material.onBeforeCompile = shader => {
            shader.uniforms.natureTime = this.time;
            shader.vertexShader = 'uniform float natureTime;\n'+shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(natureTime * 1.3 + instanceMatrix[3].x * .2 + instanceMatrix[3].z * .3) * pow(max(position.y,0.0)/3.0,2.0) * .23;');
        };
        const count = b === 'KotaKanal' ? 140 : 650;
        this.leaves = new THREE.InstancedMesh(leafGeo,material,count); this.leaves.castShadow=true;this.leaves.receiveShadow=true;
        const dummy = new THREE.Object3D();
        for (let i=0;i<count;i++) {
            const a=i*2.399, ring = 66+(i%7)*2.2;
            dummy.position.set(Math.sin(a)*ring, .1, Math.cos(a)*ring);
            if (b === 'SungaiGunung' || b === 'LautKarang') {
                for (let j = 0; j < 18; j++) {
                    const angle = j / 18 * Math.PI * 2, px = dummy.position.x - Math.sin(angle)*83, pz = dummy.position.z - Math.cos(angle)*83;
                    const width = b === 'LautKarang' ? 12 : 17, height = b === 'LautKarang' ? 15 : 12 + j % 3 * 5;
                    const falloff = Math.pow(Math.max(0,1-(px*px+pz*pz)/(width*width)),1.7);
                    const ridge = 1+.22*Math.sin(px*.6+pz*.35)+.12*Math.cos(pz*1.1-px*.25)+.06*Math.sin(px*2.7);
                    dummy.position.y = Math.max(dummy.position.y, falloff*height*ridge-.7);
                }
            }
            dummy.rotation.set((i%4)*.2, a, (i%3-1)*.25);dummy.scale.setScalar(.6+(i%5)*.17);dummy.updateMatrix();this.leaves.setMatrixAt(i,dummy.matrix);
            this.leaves.setColorAt(i,new THREE.Color(colors[i%2]));
        }
        this.root.add(this.leaves);
        const rockMat = new THREE.MeshStandardMaterial({color: b==='LautKarang'?0xb7b096:0x697367,roughness:.98,flatShading:false});
        rockMat.onBeforeCompile = shader => {
            shader.vertexShader = 'varying vec3 vRockPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockPosition=position;');
            shader.fragmentShader='varying vec3 vRockPosition;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat strata=sin(vRockPosition.y*28.0+sin(vRockPosition.x*17.0)*2.0);diffuseColor.rgb*=.85+strata*.08;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.2,.27,.12),smoothstep(.2,.8,vRockPosition.y)*.45);');
        };
        for(let i=0;i<25;i++){
            const geometry = new THREE.IcosahedronGeometry(1,3), vertices=geometry.attributes.position;
            for(let j=0;j<vertices.count;j++){
                const x=vertices.getX(j),y=vertices.getY(j),z=vertices.getZ(j),n=1+.10*Math.sin(x*8+z*4)*Math.cos(y*9)+.06*Math.sin(z*15+x*3);
                vertices.setXYZ(j,x*n,y*n,z*n);
            }
            geometry.computeVertexNormals(); const rock=new THREE.Mesh(geometry,rockMat.clone());rock.material.onBeforeCompile=rockMat.onBeforeCompile;const a=i*2.399;
            rock.position.set(Math.sin(a)*73,1.5,Math.cos(a)*73);rock.scale.set(3+i%3,2+i%4,4);rock.rotation.y=a;rock.castShadow=true;rock.receiveShadow=true;this.root.add(rock);
        }
        rockMat.dispose();
    }
    addBirds(){
        const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.8,0,0),new THREE.Vector3(0,-.18,0),new THREE.Vector3(.8,0,0)]);
        this.birds=[];
        for(let i=0;i<12;i++){const bird=new THREE.Line(geometry.clone(),new THREE.LineBasicMaterial({color:0x283936}));this.root.add(bird);this.birds.push(bird);}
        geometry.dispose();
    }
    update(time){
        this.time.value=time;
        this.birds.forEach((bird,i)=>{const a=time*.03+i*.52;bird.position.set(Math.sin(a)*65,22+i%4*3+Math.sin(time+i),Math.cos(a)*65);bird.rotation.y=-a;bird.scale.y=.4+Math.sin(time*3+i)*.5;});
    }
}
