import { FileType, Hunk, Line } from '@ceres/types';

interface LineContent {
  number: number;
  content: string;
}

export default class DiffInterpreter {
  constructor(
    private readonly hunks: Hunk[],
    private readonly fileType: FileType,
  ) {}

  async parse() {
    const parsedHunks = await Promise.all(
      this.hunks.map((hunk) => this.parseHunk(hunk)),
    );
    return parsedHunks.reduce((allHunks, currentHunks) => {
      return [...allHunks, this.createGap(), ...currentHunks];
    }, []);
  }

  private async parseHunk(hunk: Hunk) {
    let currentLine = 0;
    // Left and right numbers are usually not the same
    let leftLineNumber = hunk.oldStart;
    let rightLineNumber = hunk.newStart;

    const hunkLines: Line[] = [];
    let commentFlag = false;
    while (currentLine < hunk.lines.length) {
      const line = hunk.lines[currentLine];
      const lineType = this.determineLineType(line);
      if (lineType === Line.Type.add) {
        if(line === "+"){
          hunkLines.push(this.createBlank(line, rightLineNumber, true));
        }
        else if (line.substring(1,3) === "//" || commentFlag){
          hunkLines.push(this.createComment(line, rightLineNumber, true));
        }
        else if (line.substring(1,3) === "/*"){
          hunkLines.push(this.createComment(line, rightLineNumber, true));
          commentFlag = true;
        }
        else if(line.substring(line.length - 2) === "*/" && commentFlag){
          hunkLines.push(this.createComment(line, rightLineNumber, true));
          commentFlag = false;
        }
        else if (!line.match('[a-zA-Z1-9]')){
          hunkLines.push(this.createSyntax(line, rightLineNumber, true));
        }
        else{
          hunkLines.push(this.createAdd(line, rightLineNumber));
        }
        rightLineNumber++;
        currentLine++;
      }else if (lineType === Line.Type.noChange) {
        hunkLines.push(
          this.createNoChange(line, leftLineNumber, rightLineNumber),
        );
        leftLineNumber++;
        rightLineNumber++;
        currentLine++;
      }else if (lineType == Line.Type.delete) {
        if(line === "-"){
          hunkLines.push(this.createBlank(line, leftLineNumber, false));
        }
        else if (line.substring(1,3) === "//" || commentFlag){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
        }
        else if (line.substring(1,3) === "/*"){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
          commentFlag = true;
        }
        else if(line.substring(line.length - 2) === "*/" && commentFlag){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
          commentFlag = false;
        }
        else if (!line.match('[a-zA-Z1-9]')){
          hunkLines.push(this.createSyntax(line, leftLineNumber, false));
        }
        else{
          const { addedLines, deletedLines } = this.findGroupedChange(
            hunk.lines,
            currentLine,
            leftLineNumber,
            rightLineNumber,
          );
          hunkLines.push(...this.linkLines(deletedLines, addedLines));
          leftLineNumber += deletedLines.length;
          rightLineNumber += addedLines.length;
          currentLine += deletedLines.length + addedLines.length;
        }
      }
    }
    return hunkLines;
  }

  // First read all consecutively deleted lines, and then read all the consecutively added lines
  private findGroupedChange(
    lines: string[],
    currentLine: number,
    leftLineNumber: number,
    rightLineNumber: number,
  ) {
    const deletedLines = this.getDeletedLines(
      leftLineNumber,
      lines,
      currentLine,
    );
    const addedLines = this.getAddedLines(
      rightLineNumber,
      lines,
      currentLine + deletedLines.length,
    );
    return { deletedLines, addedLines };
  }

  // In the case when deletions are followed directly by an addition, we want to render
  // the deletion on the left side and the addition on the right side on the same line.
  // This helpers function creates the left and right side on the same line.
  private linkLines(deletedLines: LineContent[], addedLines: LineContent[]) {
    const max = Math.max(deletedLines.length, addedLines.length);
    const changes: Line[] = [];
    for (let i = 0; i < max; i++) {
      const addedLine = addedLines[i];
      const deletedLine = deletedLines[i];
      if (addedLine) {
        changes.push(
          this.createAdd(
            addedLine.content,
            addedLine.number,
            deletedLine?.content,
            deletedLine?.number,
          ),
        );
      } else {
        changes.push(
          this.createDelete(deletedLine.content, deletedLine.number),
        );
      }
    }
    return changes;
  }

  // Read all consecutive deletes so we can group them. Helper for `findGroupedChange`
  private getDeletedLines(
    leftLineNumber: number,
    lines: string[],
    currentLine: number,
  ) {
    const deletedLines: LineContent[] = [];
    let line = lines[currentLine];
    while (line && this.determineLineType(line) === Line.Type.delete) {
      deletedLines.push({
        number: leftLineNumber,
        content: line,
      });
      leftLineNumber++;
      line = lines[++currentLine];
    }
    return deletedLines;
  }

  // Read all consecutive adds so we can group them. Helper for `findGroupedChange`
  private getAddedLines(
    rightLineNumber: number,
    lines: string[],
    currentLine: number,
  ) {
    const addedLines: LineContent[] = [];
    let line = lines[currentLine];
    while (line && this.determineLineType(line) === Line.Type.add) {
      addedLines.push({
        number: rightLineNumber,
        content: line,
      });
      rightLineNumber++;
      line = lines[++currentLine];
    }
    return addedLines;
  }

  private createAdd(
    line: string,
    lineNumber: number,
    deletedLine?: string,
    deletedLineNumber?: number,
  ): Line {
    const definition: Line = {
      type: Line.Type.add,
      right: {
        lineNumber,
        lineContent: line,
      },
    };
    // If this line was added at the same time as a line was deleted, store
    // the deleted line as the left side.
    if (deletedLine && deletedLineNumber) {
      definition.left = {
        lineContent: deletedLine,
        lineNumber: deletedLineNumber,
      };
    }
    return definition;
  }

  private createComment(line: string, lineNumber: number, add: boolean): Line {
    if(add){
      return {
        type: Line.Type.comment,
        right: {
          lineNumber,
          lineContent: line,
        },
      };
    }
    else{
      return {
        type: Line.Type.comment,
        left: {
          lineNumber,
          lineContent: line,
        },
      };
    }
  }

  private createBlank(line: string, lineNumber: number, add: boolean): Line {
    if(add){
      return {
        type: Line.Type.blank,
        right: {
          lineNumber,
          lineContent: line,
        },
      };
    }
    else{
      return {
        type: Line.Type.blank,
        left: {
          lineNumber,
          lineContent: line,
        },
      };
    }
  }

  private createSyntax(line: string, lineNumber: number, add: boolean): Line {
    if(add){
      return {
        type: Line.Type.syntax,
        right: {
          lineNumber,
          lineContent: line,
        },
      };
    }
    else{
      return {
        type: Line.Type.syntax,
        left: {
          lineNumber,
          lineContent: line,
        },
      };
    }
  }

  private createDelete(line: string, lineNumber: number): Line {
    return {
      type: Line.Type.delete,
      left: {
        lineNumber,
        lineContent: line,
      },
    };
  }

  private createNoChange(
    line: string,
    leftLineNumber: number,
    rightLineNumber: number,
  ): Line {
    return {
      type: Line.Type.noChange,
      left: {
        lineContent: line,
        lineNumber: leftLineNumber,
      },
      right: {
        lineContent: line,
        lineNumber: rightLineNumber,
      },
    };
  }

  private createGap(): Line {
    return {
      type: Line.Type.gap,
    };
  }

  private determineLineType(line: string) {
    const firstChar = line.charAt(0);
    if (firstChar === '+') {
      return Line.Type.add;
    }
    if (firstChar === '-') {
      return Line.Type.delete;
    }
    return Line.Type.noChange;
  }
}
