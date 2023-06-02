import React, { useContext, useEffect, useState } from "react";
import * as yup from "yup";
import { Formik } from "formik";
import { Button, Form, FormGroup, Spinner } from "react-bootstrap";
import forge from 'node-forge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import userSocketService from "../../service/socket/user-socket.service";
import { SocketContext } from "../../context/socket";

const { pki, md } = forge;

const CreateSignature = () => {

    const [encryptionMethodChosen, setEncryptionMethodChosen] = useState("RSA");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [privateKeyPem, setPrivateKeyPem] = useState(null);
    const [publicKeyPem, setPublicKeyPem] = useState(null);
    const [certificatePem, setCertificatePem] = useState(null);
    const [keysGenerated, setKeysGenerated] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState(null);

    const socket = useContext(SocketContext);

    const schema = yup.object().shape({
        encryptionMethodChosen: yup.string().required().oneOf([
            "RSA",
            "DSA (Digital Signature Algorithm)",
            "ECDSA (Elliptic Curve Digital Signature Algorithm)",
            "EdDSA (Edwards-curve Digital Signature Algorithm)",
            "PGP (Pretty Good Privacy)"
        ]),

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

    useEffect(() => {
        if (keysGenerated) {
            userSocketService.sendCSR(socket, keysGenerated.csrPem).then(response => {
                const privateKeyPem = keysGenerated.privateKeyPem;
                const publicKeyPem = keysGenerated.publicKeyPem;
                setPrivateKeyPem(privateKeyPem);
                setPublicKeyPem(publicKeyPem);
                setCertificatePem(response);
                setLoadingMessage(null);
            }).catch(err => {
                console.error(err);
                setLoadingMessage(null);
            });
        }
    }, [keysGenerated])


    const handleCreateSignature = async () => {


        // utilisation d'un worker pour la générations de clés, pour ne pas freeze le thread principal
        const keyWorker = new Worker(process.env.PUBLIC_URL + '/workers/CreateKeysWorker.js');

        keyWorker.onmessage = (event) => {
            const { publicKeyPem, privateKeyPem, csrPem } = event.data;

            setKeysGenerated({ publicKeyPem: publicKeyPem, privateKeyPem: privateKeyPem, csrPem: csrPem });
            setLoadingMessage("Envoie au serveur")
            keyWorker.terminate();
        };

        setLoadingMessage("Générations des clés");
        keyWorker.postMessage("generateKeys");

    };

    const downloadZip = () => {

        // Convertir la clé privée PEM en format Forge
        let privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

        // Convertir le certificat PEM en format Forge
        let certificate = forge.pki.certificateFromPem(certificatePem);

        let newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
            privateKey, certificate, password, { generateLocalKeyId: true, friendlyName: 'test' }
        );

        // Convertir le keystore en binaire DER
        let newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();

        // Convertir la chaîne binaire en Uint8Array
        let newPkcs12DerUint8 = new Uint8Array(newPkcs12Der.split('').map(char => char.charCodeAt(0)));

        const zip = new JSZip();

        zip.file('public_key.pem', publicKeyPem);
        zip.file('private_key.pem', privateKeyPem);
        zip.file('certificate.pem', certificatePem);
        zip.file('keystore.p12',newPkcs12DerUint8);

        zip.generateAsync({ type: 'blob' }).then(blob => {
            saveAs(blob, 'keys_and_certificate.zip');
        })
    };

    return <div>
        <h1 className="text-center">Création d'une signature</h1>

        <p>
            Si l'utilisateur choisit une méthode de chiffrement qui n'est pas
            post quantique (par exemple RSA), il faut lui rappeler du danger qu'il y a
        </p>

        <Formik
            initialValues={{
                encryptionMethodChosen: encryptionMethodChosen,
                password: password,
                confirmPassword: confirmPassword,
            }}
            validationSchema={schema}
            onSubmit={handleCreateSignature}
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
                    <FormGroup className="mb-3" controlId="formEncryptionMethodChosenId">
                        <Form.Label>Méthode de chiffrement de votre signature</Form.Label>
                        <Form.Select
                            name="encryptionMethodChosen"
                            value={values.encryptionMethodChosen}
                            onChange={(e) => {
                                handleChange(e)
                                setEncryptionMethodChosen(e.target.value)
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.encryptionMethodChosen && !!errors.encryptionMethodChosen}
                            isValid={touched.encryptionMethodChosen && !errors.encryptionMethodChosen}
                        >
                            <option>RSA</option>
                            <option>DSA (Digital Signature Algorithm)</option>
                            <option>ECDSA (Elliptic Curve Digital Signature Algorithm)</option>
                            <option>EdDSA (Edwards-curve Digital Signature Algorithm)</option>
                            <option>PGP (Pretty Good Privacy)</option>
                        </Form.Select>
                        <Form.Control.Feedback></Form.Control.Feedback>
                    </FormGroup>

                    <FormGroup className="mb-3" controlId="formPasswordId">
                        <Form.Label>Mot de passe pour votre fichier keystore PKCS#12</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            placeholder="Quel est votre mot de passe ?"
                            value={values.password}
                            onChange={(e) => {
                                handleChange(e);
                                setPassword(e.target.value);
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
                                setConfirmPassword(e.target.value);
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

                    {
                        !certificatePem &&
                        <Button variant="success"
                            type="submit"
                            className="d-block mx-auto mt-3 mb-3"
                            // https://github.com/formium/formik/issues/1796 
                            onMouseDown={(event) => { event.preventDefault() }}
                        >
                            Créer la signature
                        </Button>
                    }

                    {
                        loadingMessage &&
                        <h4 className="text-center mt-3">
                            {loadingMessage}
                            <Spinner
                                as="span"
                                animation="grow"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                        </h4>
                    }

                    {
                        privateKeyPem && publicKeyPem && certificatePem &&
                        <Button variant="primary"
                            className="d-block mx-auto"
                            onClick={downloadZip}
                        >
                            Télécharger vos clés et certificat
                        </Button>
                    }
                </Form>
            )}
        </Formik>
    </div>
};

export default CreateSignature;