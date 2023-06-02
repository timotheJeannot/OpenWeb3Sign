import forge from 'node-forge';
import { PDFDocument, PDFHexString, PDFName, PDFNumber, PDFString } from 'pdf-lib';
import PDFArrayCustom from './PDFArrayCustom';
import { Buffer } from 'buffer';

const DEFAULT_SIGNATURE_LENGTH = 8192;
const DEFAULT_BYTE_RANGE_PLACEHOLDER = '**********';
const SUBFILTER_ADOBE_PKCS7_DETACHED = 'adbe.pkcs7.detached';
const SUBFILTER_ADOBE_PKCS7_SHA1 = 'adbe.pkcs7.sha1';
const SUBFILTER_ADOBE_X509_SHA1 = 'adbe.x509.rsa.sha1';
const SUBFILTER_ETSI_CADES_DETACHED = 'ETSI.CAdES.detached';



const sliceLastChar = (pdf, character) => {
    const lastChar = pdf.slice(pdf.length - 1);
    if (lastChar === character) {
        return pdf.slice(0, pdf.length - 1);
    }
    return pdf;
};


const removeTrailingNewLine = (pdf) => {
    let output = pdf;

    output = sliceLastChar(output, '\n'.charCodeAt(0));
    output = sliceLastChar(output, '\r'.charCodeAt(0));

    const lastLine = output.slice(output.length - 6);
    if (String.fromCharCode(...lastLine) !== '\n%%EOF') {
        throw new Error('A PDF file must end with an EOF line.');
    }

    return output;
};


function Uint8ArrayToHex(array) { // buffer is an Uint8Array
    return array.map(x => x.toString(16).padStart(2, '0'))
        .join('');
};


//https://github.com/vbuch/node-signpdf/blob/739f46e42bf49f03ca2b75b73514992f5dbd26af/src/signpdf.js#L15
const signPDF = (p12Buffer, pdfBuffer, additionalOptions) => {
    const options = {
        asn1StrictParsing: false,
        passphrase: '',
        ...additionalOptions,
    };

    if (!(pdfBuffer instanceof Uint8Array)) {
        throw new Error('PDF expected as Uint8Array.');
    }

    if (!(p12Buffer instanceof ArrayBuffer)) {
        throw new Error('p12 certificate expected as ArrayBuffer.');
    }


    let pdf = removeTrailingNewLine(pdfBuffer);

    pdf = Buffer.from(pdf);

    // Find the ByteRange placeholder.
    const byteRangePlaceholder = [
        0,
        `/${DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
        `/${DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
        `/${DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
    ];

    const byteRangeString = `/ByteRange [${byteRangePlaceholder.join(' ')}]`;
    // const byteRangePos = pdf.indexOf(byteRangeString);
    const byteRangePlaceholderBuffer = Buffer.from(byteRangeString);
    const byteRangePos = pdf.indexOf(byteRangePlaceholderBuffer);

    if (byteRangePos === -1) {
        throw new Error(`Could not find ByteRange placeholder: ${byteRangeString}`);
    }

    // Calculate the actual ByteRange that needs to replace the placeholder.
    const byteRangeEnd = byteRangePos + byteRangeString.length;
    // const contentsTagPos = pdf.indexOf('/Contents ', byteRangeEnd);
    // const placeholderPos = pdf.indexOf('<', contentsTagPos);
    // const placeholderEnd = pdf.indexOf('>', placeholderPos);

    const contentsTagsBuffer = Buffer.from('/Contents ');
    const contentsTagPos = pdf.indexOf(contentsTagsBuffer, byteRangeEnd);
    if (contentsTagPos === -1) {
        throw new Error(`Could not find contents tag: ${contentsTagsBuffer}`)
    }

    const placeHolderPosBuffer = Buffer.from('<');
    const placeholderPos = pdf.indexOf(placeHolderPosBuffer, contentsTagPos);
    if (placeholderPos === -1) {
        throw new Error(`Could not find start place holder : ${placeHolderPosBuffer}`)
    }

    const placeHolderEndBuffer = Buffer.from('>');
    const placeholderEnd = pdf.indexOf(placeHolderEndBuffer, placeholderPos);
    if (placeholderEnd === -1) {
        throw new Error(`Could not find start place holder : ${placeHolderEndBuffer}`)
    }

    const placeholderLengthWithBrackets = (placeholderEnd + 1) - placeholderPos;
    const placeholderLength = placeholderLengthWithBrackets - 2;
    const byteRange = [0, 0, 0, 0];
    byteRange[1] = placeholderPos;
    byteRange[2] = byteRange[1] + placeholderLengthWithBrackets;
    byteRange[3] = pdf.length - byteRange[2];
    let actualByteRange = `/ByteRange [${byteRange.join(' ')}]`;
    actualByteRange += ' '.repeat(byteRangeString.length - actualByteRange.length);

    pdf = new Uint8Array(pdf);

    // Replace the /ByteRange placeholder with the actual ByteRange
    pdf = new Uint8Array([
        ...pdf.slice(0, byteRangePos),
        ...new TextEncoder().encode(actualByteRange),
        ...pdf.slice(byteRangeEnd),
    ]);

    // Remove the placeholder signature
    pdf = new Uint8Array([
        ...pdf.slice(0, byteRange[1]),
        ...pdf.slice(byteRange[2], byteRange[2] + byteRange[3]),
    ]);

    // Convert Buffer P12 to a forge implementation.
    // const forgeCert = forge.util.createBuffer(p12Buffer.toString('binary'));
    const forgeCert = forge.util.createBuffer(p12Buffer);
    const p12Asn1 = forge.asn1.fromDer(forgeCert);
    const p12 = forge.pkcs12.pkcs12FromAsn1(
        p12Asn1,
        options.asn1StrictParsing,
        options.passphrase,
    );

    // Extract safe bags by type.
    // We will need all the certificates and the private key.
    const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
    })[forge.pki.oids.certBag];
    const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    })[forge.pki.oids.pkcs8ShroudedKeyBag];

    const privateKey = keyBags[0].key;
    // Here comes the actual PKCS#7 signing.
    const p7 = forge.pkcs7.createSignedData();
    // Start off by setting the content.
    p7.content = forge.util.createBuffer(pdf);

    // Then add all the certificates (-cacerts & -clcerts)
    // Keep track of the last found client certificate.
    // This will be the public key that will be bundled in the signature.
    let certificate;
    Object.keys(certBags).forEach((i) => {
        const { publicKey } = certBags[i].cert;

        p7.addCertificate(certBags[i].cert);

        // Try to find the certificate that matches the private key.
        if (privateKey.n.compareTo(publicKey.n) === 0
            && privateKey.e.compareTo(publicKey.e) === 0
        ) {
            certificate = certBags[i].cert;
        }
    });

    if (typeof certificate === 'undefined') {
        throw new Error('Failed to find a certificate that matches the private key.');
    }

    // Add a sha256 signer. That's what Adobe.PPKLite adbe.pkcs7.detached expects.
    p7.addSigner({
        key: privateKey,
        certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
            {
                type: forge.pki.oids.contentType,
                value: forge.pki.oids.data,
            }, {
                type: forge.pki.oids.messageDigest,
                // value will be auto-populated at signing time
            }, {
                type: forge.pki.oids.signingTime,
                // value can also be auto-populated at signing time
                // We may also support passing this as an option to sign().
                // Would be useful to match the creation time of the document for example.
                value: new Date(),
            },
        ],
    });

    // Sign in detached mode.
    p7.sign({ detached: true });

    // Check if the PDF has a good enough placeholder to fit the signature.
    const raw = forge.asn1.toDer(p7.toAsn1()).getBytes();
    // placeholderLength represents the length of the HEXified symbols but we're
    // checking the actual lengths.
    if ((raw.length * 2) > placeholderLength) {
        throw new Error(`Signature exceeds placeholder length: ${raw.length * 2} > ${placeholderLength}`);
    }

    // let signature = ArrayBuffer.from(raw, 'binary').toString('hex');
    const rawArray = new Uint8Array([...new TextEncoder().encode(raw)]);
    let signature = Uint8ArrayToHex(rawArray);
    // Store the HEXified signature. At least useful in tests.
    // this.lastSignature = signature;

    // Pad the signature with zeroes so the it is the same length as the placeholder
    let padding = new Uint8Array((placeholderLength / 2) - raw.length);
    let hexPadding = Uint8ArrayToHex(padding);
    signature += hexPadding;

    // Place it in the document.
    pdf = new Uint8Array([
        ...pdf.slice(0, byteRange[1]),
        ...new TextEncoder().encode(`<${signature}>`),
        ...pdf.slice(byteRange[1]),
    ]);


    // Magic. Done.
    return pdf;
};


class PDFAbstractReference {
    toString() {
        throw new Error('Must be implemented by subclasses');
    }
}

class PDFKitReferenceMock extends PDFAbstractReference {
    constructor(index, additionalData = undefined) {
        super();
        this.index = index;
        if (typeof additionalData !== 'undefined') {
            Object.assign(this, additionalData);
        }
    }

    toString() {
        return `${this.index} 0 R`;
    }
}



const unit8ToBuffer = (unit8) => {
    const buf = new Uint8Array(unit8.byteLength);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = unit8[i];
    }
    return buf;
}

//https://github.com/RichardBray/pdf_sign/blob/main/src/SignPDF.js
const addPlaceHolder = async (pdfBuffer) => {
    const loadedPdf = await PDFDocument.load(pdfBuffer);
    const ByteRange = PDFArrayCustom.withContext(loadedPdf.context);
    const DEFAULT_BYTE_RANGE_PLACEHOLDER = '**********';
    const SIGNATURE_LENGTH = 3322;
    const pages = loadedPdf.getPages();

    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));

    const signatureDict = loadedPdf.context.obj({
        Type: 'Sig',
        Filter: 'Adobe.PPKLite',
        SubFilter: SUBFILTER_ETSI_CADES_DETACHED,
        ByteRange,
        Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
        Reason: PDFString.of('We need your signature for reasons...'),
        M: PDFString.fromDate(new Date()),
    });

    const signatureDictRef = loadedPdf.context.register(signatureDict);

    const widgetDict = loadedPdf.context.obj({
        Type: 'Annot',
        Subtype: 'Widget',
        FT: 'Sig',
        Rect: [0, 0, 0, 0], // Signature rect size
        V: signatureDictRef,
        T: PDFString.of('test signature'),
        F: 4,
        P: pages[0].ref,
    });

    const widgetDictRef = loadedPdf.context.register(widgetDict);

    // Add signature widget to the first page
    pages[0].node.set(PDFName.of('Annots'), loadedPdf.context.obj([widgetDictRef]));

    loadedPdf.catalog.set(
        PDFName.of('AcroForm'),
        loadedPdf.context.obj({
            SigFlags: 3,
            Fields: [widgetDictRef],
        })
    );

    // Allows signatures on newer PDFs
    // @see https://github.com/Hopding/pdf-lib/issues/541
    const pdfBytes = await loadedPdf.save({ useObjectStreams: false });

    return unit8ToBuffer(pdfBytes);
}



export {
    signPDF,
    addPlaceHolder
}