const video1 = document.getElementById('inputVideo')
const inputtext = document.getElementById('inputtext')
var cook = document.cookie

// 儲存 cookie 的值(cookie的名字、cookie的值、儲存的天數)
function setCookie(cname,cvalue,exdays)
{
  var d = new Date();
  d.setTime(d.getTime()+(exdays*24*60*60*1000+8*60*60*1000));   // 因為是毫秒, 所以要乘以1000
  var expires = "expires="+d.toGMTString();
  console.log(expires)
  cook = cname + "=" + cvalue + "; " + expires;
}

// 得到 cookie 的值
function getCookie(cname)
{
  var name = cname + "=";
  var ca = cook.split(';');
  for(var i=0; i<ca.length; i++) 
  {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}

// 確認 cookie 的值
function checkCookie()
{
  var key = getCookie("key");
  key = inputtext.value
  if (key != "" && key != null)
  {
    setCookie("key",key,30);
    console.log(key)
  }
}


// 先讀取完模型再開啟攝影機
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),     // 偵測臉部 
    faceapi.nets.ageGenderNet.loadFromUri('/models'),         // 年紀性別
    console.log("load models OK"),
    console.log(cook),
    checkCookie(),
    console.log(cook),
  ]).then(startVideo)


/*
const stream = navigator.mediaDevices.getUserMedia({video: {}},)

wait(5000)

video1.setAttribute("autoplay", "true");
video1.setAttribute("playsinline", "true");
video1.setAttribute("muted", "true");
video1.setAttribute("loop", "true");
video1.setAttribute("controls", "true");
video1.srcObject = stream;
video1.play();
*/

async function startVideo(){
  await navigator.mediaDevices.getUserMedia({video: {}},)   
    .then(function(stream){
      console.log("setting")
      video1.setAttribute("autoplay", "true");
      video1.setAttribute("playsinline", "true");
      video1.setAttribute("muted", "true");
      video1.setAttribute("loop", "true");
      video1.setAttribute("controls", "true");
      video1.srcObject = stream;
    })
    await video1.play();
    recognizeFaces()
  }


/*
// 開啟攝影機
async function startVideo() {
    if(hasGetUserMedia()){
        // 取得攝影機權限
        await navigator.mediaDevices.getUserMedia({ video: {} })
        .then(function(stream){
            // 將攝影機分配給 video1
            video1.srcObject = stream;
            console.log("video1 GET")
        })
        .catch(function(err){
            console.log("not support")
        })

    }
    else{
        console.log("not support")
    }
    setTimeout(async () => {
        //recognizeFaces()
        console.log("start recognize")
    },1000)
  }

// 確認鏡頭是否可用
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
*/

function wait(ms){ 
    var start = new Date().getTime(); 
    var end = start; 
    while(end < start + ms) { 
    end = new Date().getTime(); 
    } 
}

var start = new Date().getTime();
var end = new Date().getTime();;

function recognizeFaces(){
    const canvas = faceapi.createCanvasFromMedia(video1)
    document.body.append(canvas)
    canvas.style.left = getPosition(video1)["x"] + "px";
    canvas.style.top = getPosition(video1)["y"] + "px";
    const displaySize = { width: video1.offsetWidth, height: video1.offsetHeight }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
    // 年紀性別
    const detections = await faceapi.detectAllFaces(video1, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender()          
                                                       
    // 得到的結果
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    start = new Date().getTime();
    if(resizedDetections.length >= 1){
        age = resizedDetections[0]['age']                // 年紀
        box = resizedDetections[0]['detection']['_box']  
        gender = resizedDetections[0]['gender']          // 性別
        //console.log(start-end)
        if(start-end >=2000){
           console.log("send to adafruit")
            $.ajax({
                url: "https://io.adafruit.com/api/v2/FM623test/feeds/step/data?X-AIO-Key="+inputtext.value,
                type: "POST",
                data: {
                  "value":parseInt(age)
                },
              })
            end = start
        }
        
    }
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)


    resizedDetections.forEach(detection => {
        canvas.style.left = getPosition(video1)["x"] + "px";
        canvas.style.top = getPosition(video1)["y"] + "px";
        const { age, gender, genderProbability } = detection
        new faceapi.draw.DrawTextField([
            `${parseInt(age, 10)} years`,
            `${gender} (${parseInt(genderProbability * 100, 10)})`
            ], detection.detection.box.topRight).draw(canvas)
        })
    checkCookie()
    }, 100)
}


// 取得元素位置
function getPosition (element) {
    var x = 0;
    var y = 0;
    while ( element ) {
      x += element.offsetLeft - element.scrollLeft + element.clientLeft;
      y += element.offsetTop - element.scrollLeft + element.clientTop;
      element = element.offsetParent;
    }
    return { x: x, y: y };
  }