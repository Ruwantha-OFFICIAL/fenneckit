import {newLabs} from "../dist/index.js"
import {shuffle} from "./libs/arry.js"

await newLabs("Arry shuffle function check", async (kit) => {
  let x = [0,5,7,8,9,0,6,3,5]

  kit.test("chek shuffle",()=>{
    let out = JSON.stringify(shuffle(x))
    kit.setTemp("shuffleArry", out);
  });
  kit.test("compere result", ()=>{
    let arry = kit.getTemp("shuffleArry");
    if(JSON.stringify(x) != arry){
     kit.done("Test is Sussesfull")
    }
  })
});