export class StoredFile {
  data: string = '';
  type: string = '';

  constructor(data: string, type?: string) {
    if (type) this.setType(type);
    if (data != undefined && type == undefined)
      this.type = data.substring(data.indexOf('/') + 1, data.indexOf(';'));
    this.setData(data);
  }

  public static fromRes<T extends { image: string; imageType: string }>(
    res: T
  ): StoredFile {
    return new StoredFile(res?.image, res?.imageType);
  }

  public changeFile(data: string, type?: string) {
    if (type) this.setType(type);
    this.setData(data);
  }

  private get typeClass(): string {
    return this.type == 'pdf' || this.type == 'json' ? 'application' : 'image';
  }
  setType(type: string) {
    this.type = type.includes('/')
      ? type.substring(type.indexOf('/') + 1)
      : type;
  }
  setData(data: string) {
    if (data == undefined || data == '') this.data = '';
    else if (data.substring(0, 4) == 'data') {
      this.data = data.substring(data.indexOf(',') + 1);
      this.type = data.substring(data.indexOf('/') + 1, data.indexOf(';'));
    } else this.data = data;
  }

  get fileEncode(): string {
    return this.data;
  }
  get webEncode(): string {
    return this.data == ''
      ? ''
      : `data:${this.typeClass}/${this.type};base64,${this.data}`;
  }
}
