export interface ILogObject {
  timestamp: string;
  message: string;
  title: string;
  level: number;
  args: any;
  file: string;
  pos: string;
  line: string;
  path: string;
  method: string;
  stack: string;
  output: string;
}
