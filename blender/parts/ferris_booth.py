"""관람차 조작실 (방 6) — 관람차 남서쪽, 큰 창이 관람차(북) · 문은 동쪽 (carousel_booth.py 의 _Booth · _booth_shell, tag = ferris)
  조작반은 gyro_drop.py 의 _console : IT_console_ferris · IT_fpower(전원 버튼) · IT_flamp · IT_fforce(알짜힘 방향 다이얼) · IT_fscreen(화면)
  IT_manual_ferris · IT_mic_ferris · SPOT_booth_ferris · LIGHT_booth_ferris (정전 때도 켜져 있다 — 비상 전원)
"""
import bpy


def build_ferris_booth():
    _clear(("bxferris_", "COL_bferris_", "IT_manual_ferris", "IT_console_ferris", "IT_mic_ferris", "LIGHT_booth_ferris", "SIGN_booth_ferris", "SIGN_manual_ferris",
            "SPOT_booth_ferris", "IT_fpower", "IT_flamp", "IT_fforce", "IT_fscreen", "SIGN_fpower", "SIGN_fforce"))
    b = _Booth("ferris", -41.0, -21.0, 90)
    _booth_shell(b)
    _console(b, "ferris", "f")
    print("FERRIS_BOOTH_OK")
