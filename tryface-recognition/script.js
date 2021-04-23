const video1 = document.getElementById('inputVideo')

// 先讀取完模型再開啟攝影機
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  ]).then(startVideo)
  
// 開啟攝影機
function startVideo() {
    if(hasGetUserMedia()){
        // 取得攝影機權限
        navigator.mediaDevices.getUserMedia({ video: {} })
        .then(function(stream){
            // 將攝影機分配給 video1
            video1.srcObject = stream;
        })
        .catch(function(err){
            console.log("not support")
        })

    }
    else{
        console.log("not support")
    }
    recognizeFaces()
  }

// 確認鏡頭是否可用
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

async function recognizeFaces(){
    const labeledDescriptors = await loadLabel()
    // 描述標籤
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.7)
        console.log("Playing")
        const canvas =  faceapi.createCanvasFromMedia(video1)
        document.body.append(canvas)

        console.log(video1.offsetWidth)
        console.log(video1.offsetHeight)

        const displaySize = { width: video1.offsetWidth, height: video1.offsetHeight}
        faceapi.matchDimensions(canvas, displaySize)

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video1).withFaceLandmarks().withFaceDescriptors()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            results.forEach((result,i) =>{
                const box = resizedDetections[i].detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
                drawBox.draw(canvas)
            })
        },100)
}

function loadLabel(){

    const labels = ["teddy"]  // 定義標籤
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = []
            for(let i=1;i<=3;i++){
                const img = await faceapi.fetchImage(`images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                //console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            //document.body.append(label+'Faces Loaded')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
            
        })
    )
}