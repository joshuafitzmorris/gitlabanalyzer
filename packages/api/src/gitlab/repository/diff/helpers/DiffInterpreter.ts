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
          leftLineNumber++;
          currentLine++;
        }
        else if (line.substring(1,3) === "//" || commentFlag){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
          leftLineNumber++;
          currentLine++;
        }
        else if (line.substring(1,3) === "/*"){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
          commentFlag = true;
          leftLineNumber++;
          currentLine++;
        }
        else if(line.substring(line.length - 2) === "*/" && commentFlag){
          hunkLines.push(this.createComment(line, leftLineNumber, false));
          commentFlag = false;
          leftLineNumber++;
          currentLine++;
        }
        else if (!line.match('[a-zA-Z1-9]')){
          hunkLines.push(this.createSyntax(line, leftLineNumber, false));
          leftLineNumber++;
          currentLine++;
        }
        else{
          const { addedLine, deletedLine } = this.findGroupedChange(
            hunk.lines,
            currentLine,
            leftLineNumber,
            rightLineNumber,
          );
          hunkLines.push(...this.linkLine(deletedLine, addedLine));
          leftLineNumber += 1;
          rightLineNumber += 1;
          currentLine += 2;
        }
      }
    }
    return hunkLines;
  }

  // First read a delte line and the matching add line
  private findGroupedChange(
    lines: string[],
    currentLine: number,
    leftLineNumber: number,
    rightLineNumber: number,
  ) {
    const deletedLine = this.getDeletedLine(
      leftLineNumber,
      lines,
      currentLine,
    );
    const addedLine = this.getAddedLine(
      rightLineNumber,
      lines,
      currentLine + 1,
    );
    return { deletedLine, addedLine };
  }

  // In the case when deletions are followed directly by an addition, we want to render
  // the deletion on the left side and the addition on the right side on the same line.
  // This helpers function creates the left and right side on the same line.
  private linkLine(deletedLine: LineContent, addedLine: LineContent) {
    const changes: Line[] = [];
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
    return changes;
  }

  // Read the deleted line. Helper for `findGroupedChange`
  private getDeletedLine(
    leftLineNumber: number,
    lines: string[],
    currentLine: number,
  ) {
    let line = lines[currentLine];
    const deletedLines: LineContent = {
      number: leftLineNumber,
      content: line,
    };
    return deletedLines;
  }

  // Read the added line. Helper for `findGroupedChange`
  private getAddedLine(
    rightLineNumber: number,
    lines: string[],
    currentLine: number,
  ) {
    let line = lines[currentLine];
    const addedLines: LineContent = {
      number: rightLineNumber,
      content: line,
    };
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
