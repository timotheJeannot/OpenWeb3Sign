import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import OW3STimer from "../ow3stimer/OW3STimer";
import userSocketService from "../../service/socket/user-socket.service";
import { SocketContext } from "../../context/socket";

const Camera = (props) => {

    const [width, setWidth] = useState(0);
    const [cameraOn, setCameraOn] = useState(false);
    const [messageError, setMessageError] = useState(null);
    const [hasRecord, setHasRecord] = useState(false);
    const [recordUrlToSend, setRecordUrlToSend] = useState(null);
    const [displayTimer, setDisplayTimer] = useState(false);

    const socket = useContext(SocketContext);

    let { socketIdOrignalDevice: socketIdOriginalDevice, firstDigit, secondDigit, thirdDigit, fourthDigit } = useParams();
    const [passCode, setPassCode] = useState({});

    const rmediaRecorder = useRef(null);
    const rstreamUserMedia = useRef(null);
    const rchunks = useRef(null);

    const finishRecord = () => {
        setWidth(0);

        if (rstreamUserMedia.current) {
            rstreamUserMedia.current.getTracks().forEach(track => {
                track.stop();
            });
            rstreamUserMedia.current = null;
        }
        if (rmediaRecorder.current) {
            rmediaRecorder.current.stop();
        }
    }

    const onClickCamera = () => {
        if (!cameraOn) {
            if (props.width && props.height) {
                setWidth(props.width);
            } else {
                setWidth(680);
            }
        } else {
            finishRecord();
            setDisplayTimer(false);
        }
        setCameraOn(!cameraOn);
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const onSendVideo = () => {
        if (socketIdOriginalDevice) {
            let blob = new Blob(rchunks.current, { mimeType: "video/webm; codecs=\"vp8, opus\"" });
            const dataToSend = {
                socketIdOriginalDevice,
                blob : blob
            }
            userSocketService.sendVideoToOriginalDevice(socket,dataToSend).catch(err => {
                console.error(err);
            })
        }
    };

    useEffect(() => {
        if (props.passCode) {
            setPassCode({
                firstDigit: props.passCode.firstDigit,
                secondDigit: props.passCode.secondDigit,
                thirdDigit: props.passCode.thirdDigit,
                fourthDigit: props.passCode.fourthDigit
            });
        }
        else {
            setPassCode({
                firstDigit: firstDigit,
                secondDigit: secondDigit,
                thirdDigit: thirdDigit,
                fourthDigit: fourthDigit
            });
        }
    }, [props.passCode]);

    useEffect(() => {
        if (props.bufferVideo) {
            let blob = new Blob([props.bufferVideo], { type: "video/webm; codecs=\"vp8, opus\"" });
            let recordUrl = window.URL.createObjectURL(blob);
            let recordedElt = document.getElementById("recorded");
            recordedElt.src = recordUrl;
            recordedElt.loop = true;
            recordedElt.play().catch(e => {

            });
            setHasRecord(true);
        }
    }, [props.bufferVideo]);

    useEffect(() => {
        if (cameraOn && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            let videoElt = document.getElementById("video");
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (stream) {

                let tracksStream = stream.getTracks();
                tracksStream.forEach((track) => {
                    track.onended = (e => {
                        console.log("test onended track");
                        console.log(e);
                        console.log(track);
                        console.log(stream);
                    });
                });

                videoElt.srcObject = stream;
                videoElt.width = width;
                videoElt.play().catch((e) => {
                    // on fait ceci pour ne pas afficher l'erreur sur l'exception qu'on ne gére pas lorsque la vidéo s'arréte
                });

                let options = {
                    audioBitsPerSecond: 128000,
                    videoBitsPerSecond: 2500000,
                    // mimeType: 'video/mp4'
                };

                rstreamUserMedia.current = stream;
                rchunks.current = [];
                rmediaRecorder.current = new MediaRecorder(stream, options);
                rmediaRecorder.current.ondataavailable = (e) => {
                    rchunks.current.push(e.data);
                }
                rmediaRecorder.current.onstop = () => {
                    let blob = new Blob(rchunks.current, { mimeType: "video/webm; codecs=\"vp8, opus\"" });
                    let recordUrl = window.URL.createObjectURL(blob);
                    let recordedElt = document.getElementById("recorded");
                    recordedElt.src = recordUrl;
                    recordedElt.loop = true;
                    recordedElt.play().catch(e => {

                    });
                    setHasRecord(true);
                    setRecordUrlToSend(recordUrl);
                    if (props.setBufferVideo) {
                        blob.arrayBuffer().then(arrayBuffer => {
                            props.setBufferVideo(arrayBuffer);
                        })
                    }
                }
                rmediaRecorder.current.start();
                setDisplayTimer(true);
                let oldValue = rstreamUserMedia.current;
                delay(props.time ? props.time * 1000 : 14000).then(() => {
                    if (rmediaRecorder.current && rstreamUserMedia.current && cameraOn && oldValue == rstreamUserMedia.current) {
                        onClickCamera();
                    }
                }).catch(() => {
                    console.log("error delay");
                })
                setMessageError(null);
            }).catch(error => {
                console.log("error camera ");
                console.log(error);
                console.log(error.message);
                setMessageError("Une erreur s'est produite : " + error.message);
            });

        }

    }, [cameraOn]);


    return <div className="mt-3">
        <div className="d-flex align-items-center justify-content-around">
            <div className="position-relative">
                <video
                    width={messageError ? 0 : width}
                    id="video"
                >
                </video>
                {
                    passCode.firstDigit != undefined && displayTimer ?
                        <div>
                            <Alert variant="info" className="position-absolute top-0 start-0 w-100 text-center">
                                Veuillez prononcer ce code
                            </Alert>
                            <div className="position-absolute top-50 d-flex w-100 justify-content-center">
                                <Alert variant="info" className="me-3">
                                    {passCode.firstDigit}
                                </Alert>
                                <Alert variant="info" className="me-3">
                                    {passCode.secondDigit}
                                </Alert>
                                <Alert variant="info" className="me-3">
                                    {passCode.thirdDigit}
                                </Alert>

                                <Alert variant="info" className="me-3">
                                    {passCode.fourthDigit}
                                </Alert>
                            </div>
                        </div>
                        :
                        null
                }
            </div>
            {displayTimer &&
                <OW3STimer time={props.time ? props.time : 14} />
            }
        </div>

        {messageError && cameraOn ?
            <div>
                <Alert variant="danger">
                    {messageError}
                </Alert>
                <Alert variant="warning">
                    Vérifier que la caméra et le micro sont bien utilisable
                </Alert>
            </div>
            : null}
        {!cameraOn &&
            <Button variant="primary"
                onClick={onClickCamera}
                className="d-block mx-auto "
            >
                Camera
            </Button>
        }
        {cameraOn &&
            <Button variant="success"
                onClick={onClickCamera}
                className="d-block mx-auto mt-5"
            >
                Fini
            </Button>
        }

        {
            hasRecord && !cameraOn &&
            <h3 className="mt-3 mb-3 text-center">Vidéo enregistrée :</h3>
        }
        {!cameraOn &&
            <div className="d-flex flex-column align-items-center justify-content-center">
                <video
                    width={hasRecord ? 680 : 0}
                    controls
                    id="recorded"
                    onClick={(e) => {
                        e.target.paused ? e.target.play().catch(e => {

                        }) : e.target.pause();
                    }}
                    style={{ cursor: "pointer" }}
                >
                </video>
                {
                    hasRecord && socketIdOriginalDevice ?
                        <Button variant="success"
                            className="float-left mt-5 mb-3"
                            onClick={onSendVideo}
                        >
                            Envoyer la vidéo
                        </Button>
                        : null
                }
            </div>
        }
    </div>

};

export default Camera;