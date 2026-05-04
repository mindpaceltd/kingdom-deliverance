import { spawn } from 'child_process'
import path from 'path'

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface TranscriptionResult {
  segments: TranscriptSegment[]
  language: string
  duration: number
}

export class TranscriptionService {
  private static readonly WHISPER_MODEL = process.env.WHISPER_MODEL || 'base'
  private static readonly TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  private static readonly MIN_TRANSCRIPT_WORDS = 100
  
  /**
   * Transcribe audio file using faster-whisper
   * Calls Python script that uses faster-whisper library
   * Progress callback receives percentage (0-1)
   */
  static async transcribe(
    audioPath: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'scripts/transcribe.py')
      
      const childProcess = spawn('python3', [
        pythonScript,
        audioPath,
        this.WHISPER_MODEL,
      ])
      
      let stdout = ''
      let stderr = ''
      let lastProgress = 0
      
      const timeout = setTimeout(() => {
        childProcess.kill()
        reject(new Error('Transcription timed out (max 30 minutes)'))
      }, this.TIMEOUT_MS)
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      childProcess.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output
        
        // Parse progress updates from Python script
        // Format: PROGRESS:0.45
        const progressMatch = output.match(/PROGRESS:([\d.]+)/)
        if (progressMatch && onProgress) {
          const progress = parseFloat(progressMatch[1])
          if (progress > lastProgress) {
            lastProgress = progress
            onProgress(progress)
          }
        }
      })
      
      childProcess.on('close', (code) => {
        clearTimeout(timeout)
        
        if (code !== 0) {
          reject(new Error(`Transcription failed: ${stderr}`))
          return
        }
        
        try {
          // Parse JSON output from Python script
          const result: TranscriptionResult = JSON.parse(stdout)
          const transcript = this.formatTranscript(result.segments)
          
          // Validate transcript length
          const wordCount = transcript.split(/\s+/).length
          if (wordCount < this.MIN_TRANSCRIPT_WORDS) {
            reject(new Error(`Transcript too short (${wordCount} words, min ${this.MIN_TRANSCRIPT_WORDS} words)`))
            return
          }
          
          resolve(transcript)
        } catch (error: any) {
          reject(new Error(`Failed to parse transcription result: ${error.message}`))
        }
      })
      
      childProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(new Error(`Failed to start transcription process: ${error.message}`))
      })
    })
  }
  
  /**
   * Format transcript segments into readable text
   */
  private static formatTranscript(segments: TranscriptSegment[]): string {
    return segments
      .map(segment => segment.text.trim())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
