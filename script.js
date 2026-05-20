var app = angular.module('orderApp', []);
app.controller('OrderController', function ($scope, $http, $window) {
    $scope.loading = false;
    $scope.resultData = null;
    $scope.errorMessage = null;
    $scope.recording = false;
    $scope.audioPreviewUrl = null;
    var apiUrl = "https://evaluate-rust-bobsled.ngrok-free.dev/v1/transcribe-order";
    var mediaRecorder = null;
    var audioChunks = [];
    $scope.startRecording = function () {
        audioChunks = [];
        $scope.resultData = null;
        $scope.errorMessage = null;
        $scope.audioPreviewUrl = null;
        $window.navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                $scope.$apply(function () {
                    $scope.recording = true;
                });
                mediaRecorder.ondataavailable = function (event) {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = function () {
                    var audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    $scope.$apply(function () {
                        $scope.audioPreviewUrl = URL.createObjectURL(audioBlob);
                        $scope.uploadAudioBlob(audioBlob);
                    });
                    stream.getTracks().forEach(track => track.stop());
                };
            })
            .catch(function (err) {
                $scope.$apply(function () {
                    $scope.errorMessage = "Permiso denegado para usar el micrófono: " + err.message;
                });
            });
    };
    $scope.stopRecording = function () {
        if (mediaRecorder && $scope.recording) {
            mediaRecorder.stop();
            $scope.recording = false;
        }
    };
    $scope.uploadAudioBlob = function (blob) {
        $scope.loading = true;
        var formData = new FormData();
        formData.append('file', blob, 'web-recording.wav');
        $http.post(apiUrl, formData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
            .then(function (response) {
                $scope.resultData = response.data;
            })
            .catch(function (error) {
                console.error(error);
                $scope.errorMessage = error.data?.detail || "Error al conectar";
            })
            .finally(function () {
                $scope.loading = false;
            });
    };
});