import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import fontkit = require('@pdf-lib/fontkit');
import {
  PDFDocument,
  PDFTextField,
  ReadingDirection,
  rgb,
  cmyk,
  setFontAndSize,
  StandardFonts,
  TextAlignment,
  PDFFont,
} from 'pdf-lib';
import { StoredFile } from './stored-file';

declare var require: any;
declare global {
  interface Window {
    FB: any;
  }
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  pdfSrc: StoredFile;
  constructor(private http: HttpClient) {}
  ngAfterViewInit(): void {
    createForm(this.http).then((f) => {
      // this.DownloadFile(new StoredFile(f), 'pdftest');
      this.pdfSrc = new StoredFile(f);
      console.log(this.pdfSrc.webEncode);
    });
  }
  ngOnInit(): void {}

  DownloadFile(file: StoredFile, fileName: string) {
    if (file) {
      var FileSaver = require('file-saver');
      FileSaver.saveAs(this.StoredFilePDFToBlob(file), `${fileName}.pdf`); //${Date.now().toString()}
    } else {
      const link = document.createElement('a');
      link.href = file?.webEncode;
      link.download = `${fileName}.pdf`;
      link.click();
    }
  }

  // async getCustomFont(
  //   pdfDoc: PDFDocument,
  //   name: string = 'Assistant'
  // ): Promise<PDFFont> {
  //   const fontData = await this.http
  //     .get(
  //       'https://github.com/DanielGabbay/pdf-font-customize/blob/main/assets/fonts/Assistant/Assistant.ttf',
  //       { responseType: 'arraybuffer' }
  //     )
  //     .toPromise();
  //   pdfDoc.registerFontkit(fontkit);
  //   return await pdfDoc.embedFont(fontData, {
  //     subset: true,
  //     customName: name,
  //   });
  // }

  StoredFilePDFToBlob(file: StoredFile) {
    const byteChars = window.atob(file.fileEncode);
    const byteNum = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNum[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNum);
    return new Blob([byteArray], { type: 'application/pdf;charset=utf-8' });
  }
  zoom = 1.1;
}

async function getCustomFont(
  http: HttpClient,
  pdfDoc: PDFDocument,
  name?: string
): Promise<PDFFont> {
  debugger;
  const fontData = await http
    .get(
      'https://github.com/DanielGabbay/pdf-font-customize/blob/main/assets/fonts/Assistant/Assistant.ttf',
      { responseType: 'arraybuffer' }
    )
    .toPromise();
  pdfDoc.registerFontkit(fontkit);
  return await pdfDoc.embedFont(fontData, {
    subset: true,
    customName: name,
  });
}

async function createForm(http: HttpClient) {
  const fontkit = require('@pdf-lib/fontkit');
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let customFont = await getCustomFont(http, pdfDoc, 'Assistant');

  console.log(customFont.sizeAtHeight(20));
  //page data
  const pageDims = { w: 550, h: 750 };
  const page = pdfDoc.addPage([pageDims.w, pageDims.h]);

  const form = pdfDoc.getForm();

  //field data
  // הגובה ההפוך מלמעלה
  const oldFieldRect = { w: 300, h: 100, left: 55, top: 10 };

  const fieldRect = {
    w: 300,
    h: 100,
    left: 55,
    top: pageDims.h - 0.5 - oldFieldRect.top - oldFieldRect.h / 2,
  };
  const textField: PDFTextField = form.createTextField('user.id');
  textField.updateAppearances(customFont);
  textField.setAlignment(TextAlignment.Center);
  textField.setText('ד');
  textField.addToPage(page, {
    x: fieldRect.left,
    y: fieldRect.top,
    font: customFont,
    backgroundColor: cmyk(0, 0, 0, 0),
  });

  const da = textField.acroField.getDefaultAppearance() ?? '';
  const newDa = da + '\n' + setFontAndSize('Arial, sans-serif', 20).toString(); //setFontAndSize() method came to resuce
  textField.acroField.setDefaultAppearance(newDa);

  const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences();
  viewerPrefs.setReadingDirection(ReadingDirection.R2L);

  const rawUpdateFieldAppearances = form.updateFieldAppearances.bind(form);
  form.updateFieldAppearances = function () {
    return rawUpdateFieldAppearances(customFont);
  };
  form.flatten();
  return await pdfDoc.saveAsBase64();
}
//const black: Color = rgb(1, 0, 0);
//page.drawRectangle({
//  x: 55,
// y: 640,
// width: fieldDims.w,
// height: fieldDims.h,
//borderColor: black,
//  borderWidth: 1.5,
//});
//page.drawText(text, {
// x: (fieldDims.w + 55) / 2,// horizontal center
// x: fieldDims.w + 55 - textWidth, // horizontal right
//x: 55, // horizontal left
//y: 640 + fieldDims.h / 2, //center vertical
// font: customFont,
//size: textSize,
//});
async function fillForm(formPdfBytes) {
  const pdfDoc = await PDFDocument.load(formPdfBytes);

  const form = pdfDoc.getForm();
  const Helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const idField = form.getTextField(form.getFields()[0].getName());
  idField.updateAppearances(Helvetica);

  const rawUpdateFieldAppearances = form.updateFieldAppearances.bind(form);
  form.updateFieldAppearances = function () {
    return rawUpdateFieldAppearances(Helvetica);
  };

  form.updateFieldAppearances();
  console.log(idField.getText());

  return await pdfDoc.saveAsBase64();
}
