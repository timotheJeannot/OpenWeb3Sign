import React, { useState } from "react";
import * as yup from "yup";
import { Formik } from "formik";
import { Button, Form, FormGroup } from "react-bootstrap";
import OW3SPDF from "../ow3sPDF/OW3SPDF";
import { saveAs } from 'file-saver';


import { signPDF, pdfkitAddPlaceholder, addPlaceHolder } from "./helper/sign";

const SignDocument = () => {

    const [pdfFile, setPdfFile] = useState(null);
    const [keystoreFile, setKeyStoreFile] = useState(null);

    const schema = yup.object().shape({
        pdfFile: yup.mixed()
            .nullable(false)
            .required("Le pdf à signer est requis")
            .test('fileType', "Le type du fichier doit être un pdf", value => !value || value.type === "application/pdf"),
        keystoreFile: yup.mixed()
            .nullable(false)
            .required("le fichier keystore.p12 est requis")
            .test('fileType', "Le type du fichier doit être pkcs12", value => !value || value.type === "application/x-pem-file" || value.type === "application/x-pkcs12")

    });

    const displayPDF = (idFile) => {
        if (idFile?.type === "application/pdf") {
            return <OW3SPDF
                file={idFile}
                className="mb-3 mt-3 mx-auto d-block border border-dark"
                maxHeight={300}
            />
        }
    };

    function readFileAsync(file, readAsBuffer) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();

            fileReader.onload = (event) => {
                resolve(event.target.result);
            };

            fileReader.onerror = (error) => {
                reject(error);
            };
            if (readAsBuffer) {
                fileReader.readAsArrayBuffer(file);
            } else {
                fileReader.readAsText(file);
            }
        });
    };

    const handleSign = async () => {
        const p12Buffer = await readFileAsync(keystoreFile, true);
        let pdfBuffer = await readFileAsync(pdfFile, true);
        pdfBuffer = new Uint8Array(pdfBuffer);


        pdfBuffer = await addPlaceHolder(pdfBuffer);

        // Utilisez les données du fichier .p12 pour signer le PDF
        const signedPdf = signPDF(p12Buffer, pdfBuffer, {
            asn1StrictParsing: true,
            passphrase: 'Sochalien25*' // Remplacez 'votre mot de passe' par le mot de passe de votre fichier p12.
        });

        const blob = new Blob([signedPdf], { type: "application/pdf" });

        saveAs(blob, "signed_pdf.pdf");

    }



    return <Formik
        initialValues={{
            pdfFile,
            keystoreFile
        }}
        validationSchema={schema}
        onSubmit={handleSign}
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
            <Form
                noValidate
                onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}
                className="mb-3"
            >
                <FormGroup className="mb-3" controlId="formIdPdfFile">
                    <Form.Label className="h2">Pdf à signer</Form.Label>

                    {
                        displayPDF(pdfFile)
                    }
                    <Form.Control
                        type="file"
                        name="pdfFile"
                        placeholder="Importez votre pdf à signer"
                        onBlur={handleBlur}
                        onChange={(e) => {
                            handleChange(e);
                            setPdfFile(e.target.files[0]);
                            setFieldValue("pdfFile", e.target.files[0]);
                        }}
                        isInvalid={touched.pdfFile && !!errors.pdfFile}
                        isValid={touched.pdfFile && !errors.pdfFile}
                    >
                    </Form.Control>
                    <Form.Control.Feedback>
                        La taille et le format du fichier sont valides
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        {errors.pdfFile}
                    </Form.Control.Feedback>
                </FormGroup>

                <FormGroup className="mb-3" controlId="formIdPrivateKeyPemFile">
                    <Form.Label className="h2"> fichier Keystore</Form.Label>
                    <Form.Control
                        type="file"
                        name="keystoreFile"
                        placeholder="Importez votre fichier keystore.p12"
                        onBlur={handleBlur}
                        onChange={(e) => {
                            handleChange(e);
                            setKeyStoreFile(e.target.files[0]);
                            setFieldValue("keystoreFile", e.target.files[0]);
                        }}
                        isInvalid={touched.keystoreFile && !!errors.keystoreFile}
                        isValid={touched.keystoreFile && !errors.keystoreFile}
                    >
                    </Form.Control>
                    <Form.Control.Feedback>
                        La taille et le format du fichier sont valides
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        {errors.keystoreFile}
                    </Form.Control.Feedback>
                </FormGroup>


                <Button variant="primary"
                    type="submit"
                    className="d-block mx-auto mt-3 mb-3"
                    // https://github.com/formium/formik/issues/1796 
                    onMouseDown={(event) => { event.preventDefault() }}
                >
                    Signer
                </Button>

            </Form>
        )}
    </Formik>
};

export default SignDocument;