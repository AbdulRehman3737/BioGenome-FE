import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
} from "@nestjs/common";
import {
  AppService,
  AnalysisResult,
  AlignmentResult,
  RestrictionResult,
} from "./app.service";

interface AnalyzeRequest {
  sequence: string;
  type: string;
}

interface AlignmentRequest {
  sequences: string[];
  sequenceType: string;
}

interface RestrictionRequest {
  sequence: string;
  enzymes?: string[];
}

@Controller("analyze")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async analyze(@Body() body: AnalyzeRequest) {
    try {
      const { sequence, type } = body;

      if (!sequence || !type) {
        throw new HttpException(
          { error: "Sequence and type are required" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.appService.analyzeSequence(sequence, type);
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message || "Internal server error" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("align")
  async align(@Body() body: AlignmentRequest) {
    try {
      const { sequences, sequenceType } = body;

      if (!sequences || sequences.length < 2) {
        throw new HttpException(
          { error: "At least 2 sequences required for alignment" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.appService.alignSequences(
        sequences,
        sequenceType,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message || "Alignment failed" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("restriction")
  async restriction(@Body() body: RestrictionRequest) {
    try {
      const { sequence, enzymes } = body;

      if (!sequence) {
        throw new HttpException(
          { error: "Sequence is required" },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.appService.analyzeRestrictionSites(
        sequence,
        enzymes,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message || "Restriction analysis failed" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("enzymes")
  async getEnzymes() {
    try {
      const result = await this.appService.getAvailableEnzymes();
      return result;
    } catch (error) {
      throw new HttpException(
        { error: error.message || "Failed to get enzymes" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
