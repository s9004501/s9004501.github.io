const video1 = document.getElementById('inputVideo')

// 先讀取完模型再開啟攝影機
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),     // 偵測臉部 
    faceapi.nets.ageGenderNet.loadFromUri('/models'),         // 年紀性別
    console.log("load models OK")
  ]).then(startVideo)


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
        recognizeFaces()
        console.log("start recognize")
    },1000)
  }

// 確認鏡頭是否可用
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

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
    if(resizedDetections.length >= 1){
        age = resizedDetections[0]['age']                // 年紀
        box = resizedDetections[0]['detection']['_box']  
        gender = resizedDetections[0]['gender']          // 性別

        $.ajax({
            url: "https://things.ubidots.com/api/v1.6/devices/esp32",
            beforeSend: function (xhrObj) {
                xhrObj.setRequestHeader("X-Auth-Token", "BBFF-2jfbCoESSQZ9kcDNXYsbcuB9inaeww");
              },
            type: "POST",
            data: {
                "try":20
            },
          })
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

