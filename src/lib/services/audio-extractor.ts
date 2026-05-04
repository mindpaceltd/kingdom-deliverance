import { exec } from 'child_process'
import { promisify } from 'util'
import { unlink } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class AudioExtractor {
  private static readonly TEMP_DIR = process.env.TEMP_AUDIO_DIR || '/tmp/sermon-audio'
  private static readonly MAX_DURATION_HOURS = 3
  private static readonly TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
  
  /**
   * Extract audio from video URL using yt-dlp
   * Returns path to downloaded audio file
   */
  static async extractAudio(videoUrl: string, jobId: string): Promise<string> {
    const timestamp = Date.now()
    const outputPath = path.join(this.TEMP_DIR, `${jobId}_${timestamp}.m4a`)
    
    // yt-dlp command: extract best audio, convert to m4a
    const command = [
      'python3 -m yt_dlp',
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', '0', // Best quality
      '--output', outputPath,
      '--no-playlist',
      '--max-filesize', '500M', // Prevent huge downloads
      `"${videoUrl}"`,
    ].join(' ')
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.TIMEOUT_MS,
      })
      
      // Check if file was created
      const fs = await import('fs/promises')
      await fs.access(outputPath)
      
      // Validate duration
      await this.validateDuration(outputPath)
      
      return outputPath
    } catch (error: any) {
      // Clean up partial download
      try {
        await unlink(outputPath)
      } catch {}
      
      if (error.message.includes('timeout')) {
        throw new Error('Audio extraction timed out (max 10 minutes)')
      }
      
      if (error.message.includes('Private video')) {
        throw new Error('Video is private or unavailable')
      }
      
      if (error.message.includes('Video unavailable')) {
        throw new Error('Video not found or region-blocked')
      }
      
      throw new Error(`Failed to download audio: ${error.message}`)
    }
  }
  
  /**
   * Validate audio duration doesn't exceed maximum
   */
  private static async validateDuration(audioPath: string): Promise<void> {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    
    try {
      const { stdout } = await execAsync(command)
      const durationSeconds = parseFloat(stdout.trim())
      const durationHours = durationSeconds / 3600
      
      if (durationHours > this.MAX_DURATION_HOURS) {
        throw new Error(`Video too long (${durationHours.toFixed(1)} hours, max ${this.MAX_DURATION_HOURS} hours)`)
      }
    } catch (error: any) {
      if (error.message.includes('Video too long')) {
        throw error
      }
      // If ffprobe fails, continue anyway (duration check is best-effort)
      console.warn('Could not validate audio duration:', error.message)
    }
  }
  
  /**
   * Delete temporary audio file
   */
  static async deleteAudioFile(audioPath: string): Promise<void> {
    try {
      await unlink(audioPath)
    } catch (error: any) {
      console.warn(`Failed to delete audio file ${audioPath}:`, error.message)
    }
  }
}
