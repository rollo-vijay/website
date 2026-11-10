#!/usr/bin/env python3
"""Renders studio-style SVG product images into site/assets/img/products/<id>.svg.
Real photos named <id>.jpg in the same folder take priority in the shop."""
import os
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'site/assets/img/products')
W, H = 600, 420

def wrap(body, glow='#d9461b'):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img">
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3a2226"/><stop offset=".6" stop-color="#1a0d10"/><stop offset="1" stop-color="#0a0506"/></radialGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{glow}" stop-opacity=".35"/><stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f4"/><stop offset=".45" stop-color="#9ea3aa"/><stop offset=".7" stop-color="#dfe2e6"/><stop offset="1" stop-color="#7d838b"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#b8841c"/></linearGradient>
<linearGradient id="black" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3f"/><stop offset="1" stop-color="#0c0c0e"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/><ellipse cx="300" cy="215" rx="260" ry="170" fill="url(#glow)"/>
<ellipse cx="300" cy="372" rx="200" ry="20" fill="#000" opacity=".6" filter="url(#sh)"/>
{body}</svg>'''

def board(x, y, w, h, c1, c2, r=10):
    return f'''<defs><linearGradient id="b{x}{y}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect x="{x}" y="{y+8}" width="{w}" height="{h}" rx="{r}" fill="#000" opacity=".5"/>
<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#b{x}{y})"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#gloss)"/>
<rect x="{x+1}" y="{y+1}" width="{w-2}" height="{h-2}" rx="{r}" fill="none" stroke="#fff" stroke-opacity=".25"/>'''

def traces(x, y, w, h, n=7, col='#ffffff', op=.10):
    s = ''
    for i in range(n):
        yy = y + 14 + i * (h - 28) / max(n - 1, 1)
        s += f'<path d="M{x+10} {yy:.0f}H{x+w*0.3:.0f}l12 10H{x+w*0.6:.0f}l10 -12H{x+w-10}" stroke="{col}" stroke-opacity="{op}" fill="none" stroke-width="1.6"/>'
    return s

def holes(x, y, w, h):
    return ''.join(f'<circle cx="{cx}" cy="{cy}" r="4" fill="#0a0506" stroke="url(#gold)" stroke-width="2"/>' for cx, cy in [(x+10, y+10), (x+w-10, y+10), (x+10, y+h-10), (x+w-10, y+h-10)])

def pins(x, y, n, step=14, vertical=False, col='black'):
    s = ''
    for i in range(n):
        px, py = (x, y + i * step) if vertical else (x + i * step, y)
        s += f'<rect x="{px}" y="{py}" width="9" height="9" rx="1" fill="url(#{col})"/><circle cx="{px+4.5}" cy="{py+4.5}" r="2.6" fill="url(#gold)"/>'
    return s

def chip(x, y, w, h, label='', col='black'):
    t = f'<text x="{x+w/2}" y="{y+h/2+3}" font-family="monospace" font-size="9" fill="#cfcfd4" text-anchor="middle" opacity=".85">{label}</text>' if label else ''
    return f'<rect x="{x}" y="{y+3}" width="{w}" height="{h}" rx="2" fill="#000" opacity=".5"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="url(#{col})"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="url(#gloss)" opacity=".5"/>{t}'

def usb(x, y, w=44, h=34):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="url(#metal)"/><rect x="{x+6}" y="{y+8}" width="{w-12}" height="{h-18}" fill="#222"/><rect x="{x+9}" y="{y+13}" width="{w-18}" height="4" fill="#d8b44a"/>'

def led(x, y, c='#ff4a3a'):
    return f'<circle cx="{x}" cy="{y}" r="6" fill="{c}" opacity=".35"/><rect x="{x-3.5}" y="{y-2.5}" width="7" height="5" rx="1" fill="{c}"/>'

def cap(x, y, c='#a9791f'):
    return f'<rect x="{x}" y="{y}" width="12" height="7" rx="1.5" fill="{c}"/><rect x="{x}" y="{y}" width="12" height="7" rx="1.5" fill="url(#gloss)"/>'

def text(x, y, s, size=11, fill='#fff', op=.8, anchor='middle', weight='700'):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}" opacity="{op}" text-anchor="{anchor}">{s}</text>'

def sensor_cyl(x, y, r=38):
    return f'<circle cx="{x}" cy="{y+4}" r="{r}" fill="#000" opacity=".5"/><circle cx="{x}" cy="{y}" r="{r}" fill="url(#metal)"/><circle cx="{x}" cy="{y}" r="{r-9}" fill="url(#black)"/><circle cx="{x}" cy="{y}" r="{r-15}" fill="#1d1d20" stroke="#555"/><circle cx="{x-9}" cy="{y-10}" r="7" fill="#fff" opacity=".18"/>'

ART = {}

def uno():
    b = board(120, 110, 360, 200, '#1c8a9e', '#0d5668')
    return b + traces(120, 110, 360, 200) + holes(120, 110, 360, 200) + usb(110, 140, 60, 50) + '<rect x="110" y="235" width="46" height="46" rx="4" fill="#222"/><rect x="114" y="239" width="38" height="38" rx="3" fill="url(#black)"/>' + chip(300, 175, 120, 28, 'ATmega328P') + chip(200, 230, 22, 22, '16.000') + led(260, 150) + led(275, 150, '#3aff7a') + pins(200, 112, 12) + pins(340, 112, 8) + pins(200, 290, 6) + pins(340, 290, 6) + text(300, 150, 'UNO', 22, '#fff', .9)
def nano():
    b = board(150, 140, 300, 120, '#1f5ec9', '#0d3a8a')
    return b + traces(150, 140, 300, 120, 4) + usb(140, 170, 40, 36) + chip(260, 175, 56, 56, 'ATmega') + chip(200, 200, 16, 16, '') + pins(170, 142, 15, 18) + pins(170, 249, 15, 18) + led(220, 172) + led(232, 172, '#3aff7a') + text(380, 205, 'NANO', 18, '#fff', .8)
def esp32():
    b = board(165, 70, 270, 270, '#202226', '#0a0b0c')
    return b + traces(165, 70, 270, 270, 8) + pins(180, 80, 15, 18, True) + pins(411, 80, 15, 18, True) + f'<rect x="215" y="82" width="170" height="104" rx="3" fill="url(#metal)"/><rect x="215" y="82" width="170" height="104" rx="3" fill="url(#gloss)" opacity=".4"/>' + text(300, 130, 'ESP-WROOM-32', 13, '#222', .85) + '<path d="M222 90h156v20h-12v-8h-12v8h-12v-8h-12v8h-12v-8h-12v8h-12v-8" fill="none" stroke="#c9a23a" stroke-width="3" opacity=".8"/>' + usb(278, 300, 44, 34) + chip(250, 215, 36, 36, '') + chip(330, 220, 30, 18, '') + led(255, 275) + text(300, 270, 'DEVKIT V1', 12, '#fff', .7)
def nodemcu():
    b = board(150, 90, 300, 230, '#1c1d20', '#08090a')
    return b + traces(150, 90, 300, 230, 7) + pins(163, 100, 15, 17, True) + pins(428, 100, 15, 17, True) + '<rect x="200" y="96" width="200" height="86" rx="3" fill="url(#metal)"/>' + text(300, 135, 'ESP-12E  ESP8266MOD', 13, '#222', .85) + usb(278, 280, 44, 34) + chip(250, 200, 40, 40, 'CH340') + led(340, 230) + text(300, 262, 'NodeMCU', 13, '#fff', .8)
def espcam():
    b = board(150, 90, 300, 230, '#23252a', '#0a0b0d')
    return b + traces(150, 90, 300, 230, 6) + sensor_cyl(300, 160, 34) + '<rect x="270" y="205" width="60" height="30" rx="3" fill="url(#black)"/>' + pins(165, 300, 8, 14) + pins(300, 300, 8, 14) + chip(190, 130, 54, 54, 'ESP32') + '<rect x="355" y="115" width="60" height="40" rx="3" fill="url(#metal)"/>' + led(430, 290) + text(300, 255, 'ESP32-CAM', 12, '#fff', .75)
def hcsr04():
    b = board(120, 110, 360, 180, '#1b7cc9', '#0b4a8a')
    return b + traces(120, 110, 360, 180, 4) + sensor_cyl(210, 195, 62) + sensor_cyl(390, 195, 62) + chip(278, 190, 44, 20, '') + pins(250, 272, 4, 22) + cap(262, 160) + text(300, 150, 'HC-SR04', 14, '#fff', .9) + text(210, 130, 'T', 12) + text(390, 130, 'R', 12)
def dht():
    return board(210, 80, 180, 240, '#2ea0d8', '#136a94', 14) + '<g>' + ''.join(f'<rect x="{225}" y="{100+i*16}" width="150" height="7" rx="3" fill="#000" opacity=".25"/>' for i in range(8)) + '</g>' + pins(240, 300, 3, 40, False) + text(300, 255, 'DHT11', 17, '#fff', .95)
def mpu():
    return board(190, 120, 220, 170, '#2a4fb5', '#10286b') + traces(190, 120, 220, 170, 5) + holes(190, 120, 220, 170) + chip(270, 175, 60, 60, 'MPU-6050') + pins(205, 262, 8, 22) + text(300, 160, 'GY-521', 14, '#fff', .9) + led(380, 150, '#3aff7a')
def irsensor():
    return board(150, 120, 300, 160, '#1f3fae', '#0c1f63') + traces(150, 120, 300, 160, 5) + '<circle cx="215" cy="175" r="26" fill="#e9eef7"/><circle cx="215" cy="175" r="26" fill="url(#gloss)"/><circle cx="215" cy="175" r="10" fill="#101830"/><circle cx="385" cy="175" r="26" fill="#1d1d22"/><circle cx="385" cy="175" r="26" fill="url(#gloss)"/><circle cx="385" cy="175" r="10" fill="#000"/>' + '<rect x="280" y="200" width="40" height="24" rx="3" fill="url(#metal)"/><circle cx="300" cy="212" r="8" fill="#e8c14a"/>' + led(260, 150) + led(340, 150, '#3aff7a') + pins(260, 255, 3, 32)
def soil():
    return '<defs><linearGradient id="soilg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1a1c"/><stop offset="1" stop-color="#0a0a0b"/></linearGradient></defs><path d="M265 70h70l8 50v200l-43 30-43-30V120z" fill="#000" opacity=".5" transform="translate(6 10)"/><path d="M265 70h70l8 50v200l-43 30-43-30V120z" fill="url(#soilg)"/><path d="M265 70h70l8 50v200l-43 30-43-30V120z" fill="url(#gloss)"/>' + '<rect x="283" y="130" width="34" height="170" fill="url(#gold)" opacity=".5"/><path d="M290 130v160M310 130v160" stroke="#d8b44a" stroke-width="4" opacity=".7"/>' + pins(285, 80, 3, 14) + text(300, 118, 'v1.2', 10, '#fff', .6)
def l298n():
    b = board(130, 100, 340, 220, '#c0222c', '#7a0d16')
    return b + traces(130, 100, 340, 220, 7, '#ffffff', .12) + holes(130, 100, 340, 220) + '<rect x="238" y="125" width="124" height="130" rx="3" fill="url(#black)"/>' + '<rect x="250" y="95" width="100" height="70" rx="3" fill="url(#metal)"/><g>' + ''.join(f'<rect x="{255+i*14}" y="105" width="8" height="52" fill="#222" opacity=".35"/>' for i in range(6)) + '</g>' + text(300, 215, 'L298N', 18, '#fff', .9) + '<rect x="146" y="150" width="46" height="44" rx="3" fill="#2d6a2b"/><rect x="408" y="150" width="46" height="44" rx="3" fill="#2d6a2b"/><circle cx="162" cy="172" r="9" fill="url(#metal)"/><circle cx="182" cy="172" r="9" fill="url(#metal)"/><circle cx="418" cy="172" r="9" fill="url(#metal)"/><circle cx="438" cy="172" r="9" fill="url(#metal)"/>' + pins(255, 285, 6, 14) + led(200, 270) + cap(215, 240)
def sg90():
    return '<rect x="170" y="150" width="260" height="130" rx="8" fill="#000" opacity=".5" transform="translate(5 10)"/><rect x="170" y="150" width="260" height="130" rx="8" fill="#2b5fd3"/><rect x="170" y="150" width="260" height="130" rx="8" fill="url(#gloss)"/><rect x="140" y="195" width="40" height="22" fill="#2b5fd3"/><rect x="420" y="195" width="40" height="22" fill="#2b5fd3"/><circle cx="154" cy="206" r="5" fill="#111"/><circle cx="446" cy="206" r="5" fill="#111"/><circle cx="380" cy="150" r="26" fill="#2b5fd3"/><circle cx="380" cy="130" r="14" fill="url(#metal)"/><path d="M380 130h-80l-6-8v16l6-8" fill="#f2f2f2" stroke="#ccc"/>' + text(250, 222, 'SG90', 20, '#fff', .9) + '<path d="M170 250c-40 10-70 16-100 10" stroke="#8a4b1a" stroke-width="5" fill="none"/><path d="M170 258c-40 10-70 20-100 20" stroke="#d63a1a" stroke-width="5" fill="none"/><path d="M170 266c-40 10-70 28-100 30" stroke="#e8c14a" stroke-width="5" fill="none"/>'
def bomotor():
    return '<circle cx="440" cy="225" r="105" fill="#000" opacity=".5" transform="translate(6 10)"/><circle cx="440" cy="225" r="105" fill="#17171a"/><circle cx="440" cy="225" r="86" fill="#0b0b0c" stroke="#2b2b30" stroke-width="10"/><circle cx="440" cy="225" r="24" fill="url(#metal)"/>' + ''.join(f'<path d="M440 225L{440+80*__import__("math").cos(a):.0f} {225+80*__import__("math").sin(a):.0f}" stroke="#2b2b30" stroke-width="6"/>' for a in [i*1.0472 for i in range(6)]) + '<rect x="110" y="170" width="190" height="110" rx="10" fill="#e8c14a"/><rect x="110" y="170" width="190" height="110" rx="10" fill="url(#gloss)"/><rect x="300" y="195" width="70" height="60" fill="url(#metal)"/><rect x="368" y="215" width="68" height="20" fill="url(#metal)"/>' + text(205, 232, 'BO MOTOR', 15, '#3a2a00', .85)
def relay():
    b = board(140, 110, 320, 190, '#1c3fa5', '#0c1f63')
    return b + traces(140, 110, 320, 190, 4) + '<rect x="190" y="125" width="130" height="95" rx="4" fill="#2468d8"/><rect x="190" y="125" width="130" height="95" rx="4" fill="url(#gloss)"/>' + text(255, 168, 'SRD-05VDC-SL-C', 11, '#fff', .9) + text(255, 188, '10A 250VAC', 10, '#fff', .75) + '<rect x="350" y="130" width="100" height="90" rx="3" fill="#1f8a3b"/><circle cx="372" cy="175" r="11" fill="url(#metal)"/><circle cx="400" cy="175" r="11" fill="url(#metal)"/><circle cx="428" cy="175" r="11" fill="url(#metal)"/>' + chip(205, 238, 22, 18, '') + led(260, 250, '#3aff7a') + led(280, 250) + pins(155, 266, 3, 14)
def lcd():
    return '<rect x="110" y="110" width="380" height="190" rx="8" fill="#000" opacity=".5" transform="translate(6 10)"/><rect x="110" y="110" width="380" height="190" rx="8" fill="#12803f"/><rect x="110" y="110" width="380" height="190" rx="8" fill="url(#gloss)"/><rect x="132" y="132" width="336" height="108" rx="4" fill="#1b2c78"/><rect x="138" y="138" width="324" height="96" rx="3" fill="#2a8ce8"/>' + ''.join(f'<rect x="{146+i*19.4}" y="{150+j*40}" width="16" height="30" fill="#0c3a8a" opacity=".55"/>' for i in range(16) for j in range(2)) + '<rect x="132" y="258" width="336" height="30" fill="#c8c2a8"/>'.replace('#c8c2a8','#0e5a2c') + pins(160, 250, 16, 17, False) + '<rect x="402" y="256" width="60" height="30" rx="3" fill="#1a5ec9"/><circle cx="420" cy="271" r="9" fill="#e8c14a"/>' + text(300, 190, 'I2C 16x2', 22, '#bfe3ff', .9)
def gps():
    b = board(180, 90, 240, 240, '#1c1d20', '#08090a')
    return b + '<rect x="200" y="105" width="200" height="130" rx="6" fill="#d9c47a"/><rect x="200" y="105" width="200" height="130" rx="6" fill="url(#gloss)"/><rect x="215" y="120" width="170" height="100" rx="4" fill="#e9d98e"/><circle cx="300" cy="170" r="22" fill="none" stroke="#a08a3a" stroke-width="2"/><path d="M300 150v40M280 170h40" stroke="#a08a3a" stroke-width="2"/>' + chip(215, 250, 54, 54, 'NEO-6M') + pins(300, 262, 4, 20) + led(380, 270, '#3aff7a') + cap(330, 300) + text(300, 322, 'GPS', 10, '#fff', .6)
def breadboard():
    s = '<rect x="110" y="110" width="380" height="190" rx="6" fill="#000" opacity=".5" transform="translate(6 10)"/><rect x="110" y="110" width="380" height="190" rx="6" fill="#efeee8"/><rect x="110" y="110" width="380" height="190" rx="6" fill="url(#gloss)" opacity=".4"/><rect x="295" y="122" width="10" height="166" fill="#cfcdc4"/>'
    for r in range(5):
        for c in range(24):
            for off in (0, 1):
                x = 128 + c * 14.1 - (0 if c < 12 else 0)
        pass
    for c in range(25):
        x = 124 + c * 14.4
        for r in range(5):
            s += f'<rect x="{x:.0f}" y="{140+r*11}" width="6" height="6" rx="1" fill="#2b2b2b"/><rect x="{x:.0f}" y="{216+r*11}" width="6" height="6" rx="1" fill="#2b2b2b"/>'
    for c in range(25):
        x = 124 + c * 14.4
        s += f'<rect x="{x:.0f}" y="118" width="6" height="6" rx="1" fill="#2b2b2b"/><rect x="{x:.0f}" y="126" width="6" height="6" rx="1" fill="#2b2b2b"/><rect x="{x:.0f}" y="276" width="6" height="6" rx="1" fill="#2b2b2b"/><rect x="{x:.0f}" y="284" width="6" height="6" rx="1" fill="#2b2b2b"/>'
    s += '<path d="M118 119h364" stroke="#d63a1a" stroke-width="2"/><path d="M118 135h364" stroke="#2b5fd3" stroke-width="2" transform="translate(0 -3)"/>'
    return s
def jumpers():
    cols = ['#d63a1a', '#e8c14a', '#2b5fd3', '#2ea34a', '#8a4b1a', '#f2f2f2', '#7a3fd3', '#ff8a1a']
    s = ''
    for i, c in enumerate(cols):
        y0 = 90 + i * 30
        s += f'<path d="M120 {y0+20}C220 {y0-40} 380 {y0+70} 480 {y0}" stroke="#000" stroke-opacity=".5" stroke-width="9" fill="none" transform="translate(3 8)"/><path d="M120 {y0+20}C220 {y0-40} 380 {y0+70} 480 {y0}" stroke="{c}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M120 {y0+20}C220 {y0-40} 380 {y0+70} 480 {y0}" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none" transform="translate(0 -2)"/><rect x="104" y="{y0+12}" width="22" height="16" rx="2" fill="#1b1b1b"/><rect x="474" y="{y0-8}" width="22" height="16" rx="2" fill="#1b1b1b"/><rect x="92" y="{y0+16}" width="14" height="8" fill="url(#gold)"/><rect x="494" y="{y0-4}" width="14" height="8" fill="url(#gold)"/>'
    return s

ART.update({'arduino-uno-r3': uno, 'arduino-nano': nano, 'esp32-devkit': esp32, 'nodemcu-esp8266': nodemcu, 'esp32-cam': espcam, 'hc-sr04': hcsr04, 'dht11': dht, 'mpu6050': mpu, 'ir-sensor': irsensor, 'soil-moisture': soil, 'l298n': l298n, 'sg90': sg90, 'bo-motor-wheel': bomotor, 'relay-1ch': relay, 'lcd-16x2-i2c': lcd, 'gps-neo6m': gps, 'breadboard-830': breadboard, 'jumper-wires': jumpers})

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for pid, fn in ART.items():
        open(os.path.join(OUT, pid + '.svg'), 'w').write(wrap(fn()))
    print(len(ART), 'product images written')
