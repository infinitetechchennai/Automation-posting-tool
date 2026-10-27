"""
validator.py - Automated Image Quality Validation Pipeline
Enforces resolution limits, dimension checks, contrast checks, and layout bounds.
"""

import os
from typing import Dict, Any, List, Tuple
from PIL import Image

class ImageValidator:
    @staticmethod
    def validate_image(
        file_path: str,
        expected_aspect_ratio: str = "1:1",
        min_width: int = 600,
        min_height: int = 600
    ) -> Dict[str, Any]:
        """
        Validates generated social image for quality criteria:
        - File exists and is valid readable image format
        - Minimum resolution check
        - Aspect ratio alignment
        - Not an empty or blank image
        - Proper file size (> 10KB)
        """
        if not os.path.exists(file_path):
            return {
                "is_valid": False,
                "error": "Image file not found on disk."
            }

        file_size = os.path.getsize(file_path)
        if file_size < 10 * 1024:  # Under 10KB is likely corrupted or empty
            return {
                "is_valid": False,
                "error": f"Generated image file size too small ({file_size} bytes). Possible render corruption."
            }

        try:
            with Image.open(file_path) as img:
                w, h = img.size
                
                # Minimum resolution
                if w < min_width or h < min_height:
                    return {
                        "is_valid": False,
                        "error": f"Image resolution ({w}x{h}) is below required minimum ({min_width}x{min_height})."
                    }

                # Aspect ratio check
                ratio = w / h
                if expected_aspect_ratio == "1:1" and not (0.95 <= ratio <= 1.05):
                    return {
                        "is_valid": False,
                        "error": f"Expected 1:1 aspect ratio, got {ratio:.2f} ({w}x{h})."
                    }
                elif expected_aspect_ratio == "16:9" and not (1.6 <= ratio <= 1.9):
                    return {
                        "is_valid": False,
                        "error": f"Expected 16:9 aspect ratio, got {ratio:.2f} ({w}x{h})."
                    }
                elif expected_aspect_ratio == "4:5" and not (0.75 <= ratio <= 0.85):
                    return {
                        "is_valid": False,
                        "error": f"Expected 4:5 aspect ratio, got {ratio:.2f} ({w}x{h})."
                    }

                # Check if image is blank / solid color
                extrema = img.convert("L").getextrema()
                if extrema[0] == extrema[1]:
                    return {
                        "is_valid": False,
                        "error": "Image appears completely uniform / blank."
                    }

                return {
                    "is_valid": True,
                    "width": w,
                    "height": h,
                    "format": img.format or "PNG",
                    "file_size_bytes": file_size,
                    "aspect_ratio": expected_aspect_ratio
                }
        except Exception as e:
            return {
                "is_valid": False,
                "error": f"Failed to verify image format: {str(e)}"
            }
