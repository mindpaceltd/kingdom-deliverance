# Python Environment Setup

## Quick Start

This project uses Python for the faster-whisper transcription service. Follow these steps to set up the Python environment.

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### Installation

1. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   ```

2. **Activate virtual environment:**
   ```bash
   # macOS/Linux:
   source venv/bin/activate
   
   # Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Verify installation:**
   ```bash
   python3 -c "from faster_whisper import WhisperModel; print('✓ Installation successful')"
   ```

### Usage

The virtual environment must be activated before running any Python scripts:

```bash
source venv/bin/activate
```

To deactivate:

```bash
deactivate
```

### Dependencies

The main dependency is `faster-whisper` for speech-to-text transcription:

- **faster-whisper**: Fast implementation of OpenAI's Whisper model
- **ctranslate2**: Efficient inference engine
- **onnxruntime**: Runtime for ONNX models
- **huggingface-hub**: Model downloading and caching

See `requirements.txt` for the complete list of dependencies.

### Model Information

The Whisper 'base' model is used by default:
- **Size**: ~150MB
- **Cache location**: `~/.cache/huggingface/hub/`
- **First run**: Model downloads automatically
- **Performance**: ~10-15 seconds per minute of audio (CPU)

### Troubleshooting

**Virtual environment not activating:**
```bash
# Ensure you're in the project root
cd /path/to/kingdom-deliverance

# Try creating a fresh environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
```

**Import errors:**
```bash
# Verify you're in the virtual environment
which python3
# Should show: /path/to/project/venv/bin/python3

# Reinstall dependencies
pip install -r requirements.txt
```

**Model download fails:**
```bash
# Check internet connectivity
curl -I https://huggingface.co

# Clear cache and retry
rm -rf ~/.cache/huggingface/hub/
python3 -c "from faster_whisper import WhisperModel; WhisperModel('base')"
```

### Development

When adding new Python dependencies:

1. Activate virtual environment
2. Install the package: `pip install package-name`
3. Update requirements: `pip freeze > requirements.txt`
4. Commit both the code and updated `requirements.txt`

### Production Deployment

For production deployment, see the [Deployment Guide](./sermon-queue-processor-deployment.md) for complete instructions including:
- System requirements
- Performance tuning
- Monitoring and logging
- Security considerations

---

**Python Version**: 3.10.12  
**faster-whisper Version**: 1.2.1  
**Last Updated**: May 4, 2025
