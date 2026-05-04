#!/usr/bin/env python3
"""
Transcription script using faster-whisper
Called by Node.js worker process

This script:
1. Loads a faster-whisper model (configurable: base, small, medium, large)
2. Transcribes audio with VAD (voice activity detection) enabled
3. Reports progress to stderr in format: PROGRESS:0.45
4. Outputs JSON result to stdout with segments array
5. Uses proper exit codes (0 for success, 1 for errors)

Usage:
    python3 transcribe.py <audio_path> <model_name>

Example:
    python3 transcribe.py /tmp/audio.m4a base

Output format (stdout):
    {
        "segments": [
            {"start": 0.0, "end": 1.5, "text": "Hello world"},
            {"start": 1.5, "end": 3.0, "text": "This is a test"}
        ],
        "language": "en",
        "duration": 3.0
    }

Progress format (stderr):
    PROGRESS:0.45
"""

import sys
import json
from faster_whisper import WhisperModel


def transcribe_audio(audio_path: str, model_name: str = 'base') -> None:
    """
    Transcribe audio file using faster-whisper
    
    Args:
        audio_path: Path to audio file (m4a, mp3, wav, etc.)
        model_name: Whisper model to use (base, small, medium, large, large-v2, large-v3)
    
    Outputs:
        JSON to stdout with segments, language, and duration
        Progress updates to stderr in format PROGRESS:0.45
    
    Exit codes:
        0: Success
        1: Error (invalid arguments, file not found, transcription failed)
    """
    try:
        # Load faster-whisper model
        # device="cpu" for compatibility, compute_type="int8" for efficiency
        # For GPU acceleration, use device="cuda" and compute_type="float16"
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
        
        # Transcribe with VAD (voice activity detection) enabled
        # VAD filters out non-speech segments for better accuracy
        segments, info = model.transcribe(
            audio_path,
            language="en",  # Auto-detect if None, but "en" is faster for English sermons
            beam_size=5,    # Balance between speed and accuracy
            vad_filter=True,  # Enable voice activity detection
            vad_parameters=dict(
                min_silence_duration_ms=500,  # Minimum silence duration to split segments
            ),
        )
        
        # Collect segments and report progress
        result_segments = []
        total_duration = info.duration
        
        if total_duration <= 0:
            print("Error: Audio duration is zero or invalid", file=sys.stderr)
            sys.exit(1)
        
        # Process segments and report progress
        for segment in segments:
            result_segments.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text
            })
            
            # Report progress to stderr
            # Progress is based on how much of the audio has been processed
            progress = min(segment.end / total_duration, 1.0)  # Cap at 1.0
            print(f"PROGRESS:{progress:.2f}", file=sys.stderr, flush=True)
        
        # Final progress update
        print("PROGRESS:1.00", file=sys.stderr, flush=True)
        
        # Output JSON result to stdout
        result = {
            "segments": result_segments,
            "language": info.language,
            "duration": info.duration
        }
        
        print(json.dumps(result), flush=True)
        
    except FileNotFoundError:
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    # Validate command-line arguments
    if len(sys.argv) < 3:
        print("Usage: transcribe.py <audio_path> <model_name>", file=sys.stderr)
        print("", file=sys.stderr)
        print("Arguments:", file=sys.stderr)
        print("  audio_path  - Path to audio file (m4a, mp3, wav, etc.)", file=sys.stderr)
        print("  model_name  - Whisper model: base, small, medium, large, large-v2, large-v3", file=sys.stderr)
        print("", file=sys.stderr)
        print("Example:", file=sys.stderr)
        print("  python3 transcribe.py /tmp/audio.m4a base", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    model_name = sys.argv[2]
    
    # Validate model name
    valid_models = ['tiny', 'base', 'small', 'medium', 'large', 'large-v1', 'large-v2', 'large-v3']
    if model_name not in valid_models:
        print(f"Error: Invalid model name '{model_name}'", file=sys.stderr)
        print(f"Valid models: {', '.join(valid_models)}", file=sys.stderr)
        sys.exit(1)
    
    # Run transcription
    transcribe_audio(audio_path, model_name)
