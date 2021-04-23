
const video = document.getElementById('video')
const sta = document.getElementById('sta')

// 先讀取完模型再開啟攝影機
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(startVideo)

// 開啟攝影機
function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

var face = false

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.offsetWidth, height: video.offsetHeight }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    //const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                                      .withFaceLandmarks()
                                                      .withFaceExpressions()
                                                      .withAgeAndGender()
                                                      .withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

    resizedDetections.forEach(detection => {
      const { age, gender, genderProbability } = detection
      new faceapi.draw.DrawTextField([
          `${parseInt(age, 10)} years`,
          `${gender} (${parseInt(genderProbability * 100, 10)})`
      ], detection.detection.box.topRight).draw(canvas)
    })
    
  }, 100)
})
