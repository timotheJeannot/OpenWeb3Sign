import React, { Fragment, useContext, useEffect, useState } from "react";
import * as yup from "yup";
import { Formik } from "formik";
import { Alert, Button, Form, FormGroup, Nav } from "react-bootstrap";
import OW3SPDF from "../ow3sPDF/OW3SPDF";
import OW3SImage from "../ow3simage/OW3SImage";
import Camera from "../camera/Camera";
import { SocketContext } from "../../context/socket";
import userSocketService from "../../service/socket/user-socket.service";
import QRCode from "react-qr-code";


const SignUp = () => {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [idFileFront, setIdFileFront] = useState(null);
    const [idFileBack, setIdFileBack] = useState(null);
    const [idFileFrontObject, setIdFileFrontObject] = useState(null);
    const [idFileBackObject, setIdFileBackObject] = useState(null);

    const [bufferVideo, setBufferVideo] = useState(null);

    const [alertMessage, setAlertMessage] = useState(null);

    const [passCodeVideo, setPassCodeVideo] = useState(null);
    const [URLState, setURLState] = useState(undefined);

    const socket = useContext(SocketContext);

    // voir quelle valeur limite il faut mettre pour ce genre de fichier
    const FILE_SIZE_LIMIT = 40 * 1048576; //https://stackoverflow.com/questions/5697605/limit-the-size-of-a-file-upload-html-input-element
    const SUPPORTED_FORMATS = ["application/pdf", "image/jpeg", "image/png"];

    const schema = yup.object().shape({
        idFileFront: yup.mixed()
            .nullable(false)
            .required("Une pièce d'identité recto est nécessaire")
            .test('fileSize', "la taille du fichier est trop gros" + " : 40 MB max", value => !value || value.size <= FILE_SIZE_LIMIT)
            .test('fileType', "Le type du fichier doit être un pdf, jpg ou un pdg", value => !value || SUPPORTED_FORMATS.includes(value.type))
        ,
        idFileBack: yup.mixed()
            .nullable(false)
            .required("Une pièce d'identité verso est nécessaire")
            .test('fileSize', "la taille du fichier est trop gros", value => !value || value.size <= FILE_SIZE_LIMIT)
            .test('fileType', "Le type du fichier doit être un pdf, jpg ou un pdg", value => !value || SUPPORTED_FORMATS.includes(value.type)),

        email: yup.string().email("Cet email n'est pas valide").required("Ce champ est obligatoire !"),

        password: yup
            .string()
            .required("Le mot de passe est obligatoire")
            .matches(
                /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
                "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un nombre et un caractère spécial"
            ),

        confirmPassword: yup
            .string()
            .required("La confirmation du mot de passe est obligatoire")
            .oneOf([yup.ref("password"), null], "Les mots de passe doivent correspondre"),

    });

    const listenerVideoSocket = (buffer) => {
        setBufferVideo(buffer);
    };

    useEffect(() => {
        if (socket) {
            userSocketService.getPassCodeVideo(socket).then(response => {
                console.log("test response");
                console.log(response);
                setPassCodeVideo(response);
            }).catch(error => {
                console.error(error);
            })

            socket.on("buffer video register user", listenerVideoSocket);

            return () => {
                socket.off("buffer video register user", listenerVideoSocket); // ici le listener peut être omis pour supprimer tout les listeners à cette événement
            }
        }
    }, [socket]);

    useEffect(() => {
        if (passCodeVideo) {
            setURLState(window.location.origin + "/camera/" + socket.id + "/" + passCodeVideo.firstDigit + "/" + passCodeVideo.secondDigit + "/" + passCodeVideo.thirdDigit + "/" + passCodeVideo.fourthDigit)
        }
    }, [passCodeVideo]);

    const handleSignUp = () => {
        if (!bufferVideo) {
            setAlertMessage("la vérification vidéo est obligatoire");
            return;
        }
        setAlertMessage(null);
        const dataToSend = {
            password: password,
            email: email,
            idFileFront: idFileFront,
            idFileBack: idFileBack,
            idFileFrontObject: idFileFrontObject,
            idFileBackObject: idFileBackObject,
            bufferVideo: bufferVideo
        }

        userSocketService.registerUser(socket, dataToSend).then(response => {
            console.log("utilisateur enregistré");
            console.log(response);
        }).catch(error => {
            console.error(error)
        })
    };

    const onChangeEmail = (e) => {
        setEmail(e.target.value);
    };

    const onChangePassword = (e) => {
        setPassword(e.target.value);
    };

    const onChangeConfirmPassword = (e) => {
        setConfirmPassword(e.target.value);
    };

    const display = (idFile, idFileObject) => {
        if (idFile && idFileObject) {
            if (idFile.type === "application/pdf") {
                return <OW3SPDF
                    file={idFile}
                    className="mb-3 mt-3 mx-auto d-block border border-dark"
                    maxHeight={300}
                />
            } else {
                return <OW3SImage
                    src={idFileObject}
                    className="mb-3 mt-3 mx-auto d-block "
                    size={300}
                    noSquare={true}
                />
            }
        }
    }


    return <div>
        <h1 className="text-center">Inscription</h1>

        <Formik
            initialValues={{
                password: password,
                email: email,
                confirmPassword: confirmPassword,
                idFileFront: idFileFront,
                idFileBack: idFileBack
            }}
            validationSchema={schema}
            onSubmit={handleSignUp}
            enableReinitialize={true}
        >
            {({
                handleSubmit,
                handleChange,
                handleBlur,
                submitForm,
                validateForm,
                setFieldValue,
                values,
                touched,
                isValid,
                errors

            }) => (
                <Form noValidate
                    onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}
                    className="mb-3"
                >
                    <FormGroup className="mb-3" controlId="formEmailId">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            placeholder="Quel est votre email ?"
                            value={values.email}
                            onChange={(e) => {
                                handleChange(e);
                                onChangeEmail(e);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.email && !!errors.email}
                            isValid={touched.email && !errors.email}
                        />
                        <Form.Control.Feedback>
                            Cette email sera utilisé pour confirmer votre inscription et vos signatures"
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.email}
                        </Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formPasswordId">
                        <Form.Label>Mot de passe</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder="Quel est votre mot de passe ?"
                            value={values.password}
                            onChange={(e) => {
                                handleChange(e);
                                onChangePassword(e);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.password && !!errors.password}
                            isValid={touched.password && !errors.password}
                        />
                        <Form.Control.Feedback>
                            C'est un bon mot de passe, gardez le pour vous !
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formConfirmPasswordId">
                        <Form.Label>Confirmation du mot de passe</Form.Label>
                        <Form.Control
                            type="password"
                            name="confirmPassword"
                            placeholder="Quel est votre mot de passe ?"
                            value={values.confirmPassword}
                            onChange={(e) => {
                                handleChange(e);
                                onChangeConfirmPassword(e);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                            isValid={touched.confirmPassword && !errors.confirmPassword}
                        />
                        <Form.Control.Feedback>
                            C'est la même valeur !
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                        </Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formIdFileFront">
                        <Form.Label className="h2">Pièce d'identité recto</Form.Label>
                        {
                            display(idFileFront, idFileFrontObject)
                        }
                        <Form.Control
                            type="file"
                            name="idFileFront"
                            //value={values.idFileFront}
                            placeholder="Importez votre pièce d'identité face recto"
                            onBlur={handleBlur}
                            onChange={(e) => {
                                handleChange(e);
                                setIdFileFront(e.target.files[0]);
                                setIdFileFrontObject(URL.createObjectURL(e.target.files[0]));
                                setFieldValue("idFileFront", e.target.files[0]);
                            }}
                            isInvalid={touched.idFileFront && !!errors.idFileFront}
                            isValid={touched.idFileFront && !errors.idFileFront}
                        >
                        </Form.Control>
                        <Form.Control.Feedback>
                            La taille et le format du fichier sont valides
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.idFileFront}
                        </Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formIdFileBack">
                        <Form.Label className="h2">Pièce d'identité verso</Form.Label>
                        {
                            display(idFileBack, idFileBackObject)
                        }
                        <Form.Control
                            type="file"
                            name="idFileBack"
                            placeholder="Importez votre pièce d'identité face verso"
                            onBlur={handleBlur}
                            onChange={(e) => {
                                handleChange(e);
                                setIdFileBack(e.target.files[0]);
                                setIdFileBackObject(URL.createObjectURL(e.target.files[0]));
                                setFieldValue("idFileBack", e.target.files[0]);
                            }}
                            isInvalid={touched.idFileBack && !!errors.idFileBack}
                            isValid={touched.idFileBack && !errors.idFileBack}
                        >
                        </Form.Control>
                        <Form.Control.Feedback>
                            La taille et le format du fichier sont valides
                        </Form.Control.Feedback>
                        <Form.Control.Feedback type="invalid">
                            {errors.idFileBack}
                        </Form.Control.Feedback>
                    </FormGroup>

                    {
                        idFileFrontObject && idFileBackObject && !errors.idFileBack
                            && !errors.idFileFront ?

                            <Fragment>
                                <h4 className="text-center">
                                    Vérification vidéo
                                </h4>

                                <Alert variant="info" className="mt-3 text-center">
                                    Si vous n'avez pas de caméra avec cette appareil, vous pouvez utiliser un autre appareil
                                    à l'aide de ce lien ou de ce QRCode
                                </Alert>
                                <QRCode value={URLState} className="d-block mx-auto mt-5 mb-3" />
                                {/* <Nav.Link href={URLState} className="text-center">{URLState}</Nav.Link> */}
                                <div className="text-center"><a href={URLState}>{URLState}</a></div>

                                <Camera
                                    time={14}
                                    passCode={passCodeVideo}
                                    bufferVideo={bufferVideo}
                                    setBufferVideo={setBufferVideo}
                                />
                            </Fragment>
                            :
                            null
                    }


                    {
                        alertMessage &&
                        <Alert variant="danger" className="mt-3 text-center">
                            {alertMessage}
                        </Alert>
                    }

                    <Button variant="success"
                        type="submit"
                        className="d-block mx-auto mt-3 mb-3"
                        // https://github.com/formium/formik/issues/1796 
                        onMouseDown={(event) => { event.preventDefault() }}
                    >
                        S'inscrire
                    </Button>
                </Form>
            )}

        </Formik>
    </div>
};

export default SignUp;