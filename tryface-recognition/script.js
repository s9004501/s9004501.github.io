const video = document.getElementById('inputVideo')

// 先讀取完模型再開啟攝影機
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  ]).then(startVideo)
  
// 開啟攝影機
function startVideo() {
    // 取得權限
    navigator.mediaDevices.getUserMedia(
      { video: {} },
      stream => video.srcObject = stream,
      err => console.error(err)
    )

    console.log("have picture")
    recognizeFaces()
  }

async function recognizeFaces(){
    const labeledDescriptors = await loadLabel()
    // 描述標籤
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.7)

    video.addEventListener('play', async() => {
        console.log("Playing")
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)

        const displaySize = { width: video.width, height: video.height }
        faceapi.matchDimensions(canvas, displaySize)

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
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
})
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