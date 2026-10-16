#!/usr/bin/env python3
"""Zapper control: manage every Zapper on your own network from one page.

Opens a page in your browser with a card for every Zapper it finds, in the same
look as the lamp's own web interface. From there:

  - see at a glance how each one is doing: version, Wi-Fi, relays, output, zaps
  - open one Zapper's settings: lamp mode, quiet hours, buzzer and tune,
    milestones, goal, profile, alerts, and its event log
  - select several and act on all of them, one after the other: update the
    firmware, celebrations, common settings, copy settings, Wi-Fi, backups
  - rename, find (blink white), test zap, simulated zap, restart, self-test

    python3 zapper-control.py               # page in the browser
    python3 zapper-control.py --lijst       # only list what it finds
    python3 zapper-control.py --alle --ja   # update everything, no page

The page only listens on 127.0.0.1 and every action needs a token only the page
knows. Passwords stay in memory while it runs and are never written to disk; the
list of Zappers seen before (name, address, MAC) is kept in
~/.config/zapper-control/bekend.json so a Zapper that is off still shows as
offline. It stops by itself a while after the page is closed.
"""
import argparse
import glob
import hashlib
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# The version of this program itself. Raise it with every change that should
# reach other people's copies; the release step publishes it.
CONTROL_VERSIE = "2.3"

WORTEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Running from the source tree (firmware sources and git history), or as a
# downloaded single file? Only the latter updates itself.
IN_REPO = os.path.isdir(os.path.join(WORTEL, "src")) and os.path.isdir(os.path.join(WORTEL, ".git"))
# Online updates: the public channel and the release key's public half (the same
# as RELEASE_PUBKEY in the firmware).
UPDATE_BRON = "https://raw.githubusercontent.com/JaccoElektro/zapper-updates/main/"
RELEASE_PUBKEY = "5e3ccae16b53c902c312cc4af9290575915f569fde9439f5a6cc2d7670d7d543"
CACHE = os.path.expanduser("~/.cache/zapper-control")
# Logo and lamp pictures for a copy that runs without the repository; the
# published file has them filled in when it is released.
INGEBED = {"logo": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 295.94 295.94\">\n  <!-- Generator: Adobe Illustrator 30.6.0, SVG Export Plug-In . SVG Version: 2.1.4 Build 109)  -->\n  <defs>\n    <style>\n      .st0 {\n        stroke-width: 3.58px;\n      }\n\n      .st0, .st1, .st2, .st3, .st4, .st5, .st6, .st7, .st8, .st9, .st10, .st11 {\n        stroke: #000;\n      }\n\n      .st0, .st1, .st3, .st4, .st5, .st6, .st7, .st8, .st9, .st10, .st11 {\n        stroke-linecap: round;\n        stroke-linejoin: round;\n      }\n\n      .st0, .st1, .st3, .st8 {\n        fill: none;\n      }\n\n      .st1 {\n        stroke-width: 2.42px;\n      }\n\n      .st2 {\n        stroke-miterlimit: 10;\n      }\n\n      .st2, .st5, .st6, .st12 {\n        fill: #fff;\n      }\n\n      .st2, .st10 {\n        stroke-width: 4.21px;\n      }\n\n      .st13 {\n        fill: #ed1f33;\n      }\n\n      .st3 {\n        stroke-width: 2.01px;\n      }\n\n      .st4 {\n        fill: #e92134;\n        stroke-width: 1.17px;\n      }\n\n      .st5 {\n        stroke-width: 4.21px;\n      }\n\n      .st6 {\n        stroke-width: 4.15px;\n      }\n\n      .st7 {\n        fill: #fbc808;\n        stroke-width: 1.79px;\n      }\n\n      .st8 {\n        stroke-width: .85px;\n      }\n\n      .st14 {\n        fill: #fbc80e;\n      }\n\n      .st9 {\n        fill: #ef8d25;\n        stroke-width: 1.35px;\n      }\n\n      .st15 {\n        fill: #ff7f00;\n      }\n\n      .st10 {\n        fill: #e02835;\n      }\n\n      .st11 {\n        fill: #e91f33;\n        stroke-width: 2.24px;\n      }\n\n      .st16 {\n        fill: #9d00f9;\n      }\n    </style>\n  </defs>\n  <rect class=\"st16\" width=\"295.94\" height=\"295.94\"/>\n  <g>\n    <rect class=\"st6\" x=\"116.05\" y=\"154.84\" width=\"43.04\" height=\"46.65\"/>\n    <g>\n      <line class=\"st6\" x1=\"140.85\" y1=\"186.73\" x2=\"157.48\" y2=\"186.73\"/>\n      <line class=\"st6\" x1=\"140.85\" y1=\"169.6\" x2=\"157.48\" y2=\"169.6\"/>\n    </g>\n    <g>\n      <polygon class=\"st6\" points=\"69.02 154.82 68.97 201.49 88.13 201.49 88.13 181.14 114.52 181.14 114.52 154.82 69.02 154.82\"/>\n      <line class=\"st6\" x1=\"88.5\" y1=\"167.81\" x2=\"99.54\" y2=\"167.81\"/>\n    </g>\n    <g>\n      <polygon class=\"st6\" points=\"159.89 154.84 159.88 201.49 207.88 201.49 190 179.73 205.37 179.73 205.37 154.84 159.89 154.84\"/>\n      <line class=\"st6\" x1=\"177.57\" y1=\"189.43\" x2=\"186.52\" y2=\"201.22\"/>\n      <line class=\"st6\" x1=\"177.75\" y1=\"168.05\" x2=\"188.47\" y2=\"168.05\"/>\n    </g>\n    <g>\n      <path class=\"st14\" d=\"M229.63,171.8h12.87s.54-4.05,1.17-4.77,6.12-7.02,6.03-11.25-2.88-14.13-12.96-14.85c-10.08-.72-14.13,8.46-14.22,11.61s1.17,8.82,3.33,10.71,3.87,7.56,3.78,8.55Z\"/>\n      <g>\n        <path d=\"M234.93,139.8c8.68-.02,14.98,5.48,15.94,12.97.46,3.55-.23,6.89-2.17,9.93-.64.99-1.43,1.86-2.27,2.68-.96.93-1.83,1.93-2.25,3.24-.31.96-.42,1.94-.34,2.94.05.56-.14.98-.63,1.26-.07.04-.16.11-.23.1-.46-.06-.45.22-.43.54.02.42,0,.83.23,1.24.21.37.22.84-.15,1.2-.08.08-.08.17-.09.26,0,.43,0,.86,0,1.29,0,.13.06.23.12.33.31.5.3,1-.03,1.48-.08.13-.09.24-.09.37,0,.61.01,1.22.01,1.83,0,.73-.46,1.21-1.18,1.2-.22,0-.31.06-.41.24-2.12,3.73-7.34,3.81-9.58.15-.17-.28-.32-.43-.68-.41-.6.02-1.05-.48-1.06-1.09,0-.61,0-1.22.02-1.83,0-.2-.04-.36-.15-.53-.27-.42-.28-.87,0-1.28.12-.17.16-.34.16-.53,0-.29,0-.57,0-.86,0-.28-.01-.54-.19-.81-.26-.39-.15-.81.07-1.22.26-.47.08-.98.1-1.47,0-.08-.1-.08-.17-.09-.91-.18-1.21-.53-1.14-1.46.13-1.96-.38-3.7-1.67-5.19-.67-.78-1.46-1.45-2.13-2.23-1.81-2.09-2.82-4.55-3.18-7.26-.6-4.4.49-8.36,3.39-11.73,2.97-3.45,6.77-5.18,10.17-5.24ZM234.89,170.77c.8-.02,1.6-.02,2.41,0M240.15,170.75c.37-.02.74-.01,1.11,0,.21,0,.29-.08.3-.29.1-2.25.98-4.17,2.49-5.81.71-.77,1.54-1.45,2.17-2.3,2.74-3.7,3.22-7.76,1.75-12.05-2.05-5.95-8.31-9.12-14.06-8.09-5.85,1.04-10.16,5.86-10.44,11.79-.18,3.84,1.05,7.18,3.91,9.85,1.95,1.82,3.16,4.01,3.27,6.72,0,.19.09.22.25.21.35,0,.7-.03,1.04,0M236.1,174.05v-.02c1.18,0,2.37,0,3.55,0,.7,0,.67,0,.71-.7.02-.39-.12-.45-.46-.44-2.4.02-4.81.02-7.21.03-.8,0-.79,0-.83.79-.01.27.06.35.33.35,1.3-.01,2.61,0,3.91,0ZM236.14,176.23h0c-1.15,0-2.3,0-3.45,0-.81,0-.79,0-.81.81,0,.31.1.37.39.36,2.42-.02,4.83-.02,7.25-.02.83,0,.81,0,.82-.83,0-.26-.08-.32-.33-.32-1.29.01-2.58,0-3.88,0ZM236.16,179.49h0c-1.18,0-2.37,0-3.55,0-.69,0-.68,0-.7.7,0,.29.06.38.37.38,2.44-.02,4.88-.02,7.32-.02.74,0,.72,0,.74-.72,0-.28-.08-.34-.34-.34-1.28.01-2.56,0-3.84,0ZM238.19,182.74h-4.11c1.12,1.05,3.03,1.05,4.11,0Z\"/>\n        <path d=\"M237.19,132.2c0,.83.01,1.65,0,2.48-.01.62-.5,1.1-1.09,1.11-.59.01-1.12-.5-1.14-1.12-.02-.71,0-1.41,0-2.12,0-.96,0-1.91,0-2.87,0-.55.32-.96.77-1.09.48-.14.97.02,1.28.42.18.24.2.51.2.78,0,.8,0,1.6,0,2.41,0,0-.02,0-.02,0Z\"/>\n        <path d=\"M220.81,142.6c-.25-.01-.46-.08-.63-.24-1.22-1.13-2.41-2.29-3.57-3.49-.49-.5-.45-1.14,0-1.6.45-.45,1.1-.47,1.61,0,1.17,1.11,2.32,2.25,3.46,3.39.34.34.41.76.21,1.19-.21.46-.59.71-1.09.74Z\"/>\n        <path d=\"M250.2,141.42c-.01-.27.1-.52.29-.73,1.15-1.18,2.31-2.35,3.54-3.45.52-.46,1.16-.42,1.58.03.42.46.42,1.15-.05,1.62-1.12,1.11-2.25,2.21-3.39,3.3-.37.36-.82.5-1.32.27-.42-.2-.67-.54-.66-1.04Z\"/>\n        <path d=\"M225.75,131.61c.41.01.79.22.99.69.59,1.43,1.17,2.86,1.73,4.29.25.64-.02,1.28-.61,1.53-.56.23-1.2-.04-1.47-.67-.6-1.42-1.2-2.84-1.76-4.28-.31-.8.22-1.57,1.12-1.56Z\"/>\n        <path d=\"M247.68,132.78c0,.15-.05.32-.12.49-.55,1.36-1.1,2.73-1.66,4.09-.26.63-.93.95-1.52.73-.57-.21-.88-.89-.63-1.52.56-1.43,1.14-2.84,1.73-4.25.24-.57.8-.83,1.34-.71.51.11.85.58.85,1.18Z\"/>\n        <path d=\"M260.32,146.04c-.02.32-.21.65-.6.83-1.37.65-2.75,1.29-4.12,1.93-.54.25-1.19,0-1.47-.52-.27-.51-.11-1.15.42-1.46.85-.49,1.77-.84,2.65-1.26.52-.25,1.03-.5,1.57-.71.74-.29,1.55.28,1.55,1.19Z\"/>\n        <path d=\"M213.11,144.75c.17-.01.35.05.52.14,1.29.61,2.58,1.21,3.86,1.82.73.35.92,1.18.41,1.76-.29.34-.86.5-1.28.31-1.38-.63-2.76-1.27-4.12-1.93-.51-.25-.71-.73-.59-1.22.13-.53.59-.87,1.19-.87Z\"/>\n        <path d=\"M258.11,154.63c.71,0,1.41,0,2.12,0,.65,0,1.15.46,1.17,1.07.02.63-.45,1.16-1.11,1.17-1.46.02-2.92.02-4.38,0-.67,0-1.11-.48-1.11-1.12,0-.61.48-1.1,1.12-1.11.73-.02,1.46,0,2.19,0,0,0,0,0,0-.01Z\"/>\n        <path d=\"M219.96,164.57c0,.5-.36.77-.8.98-.59.29-1.19.56-1.78.84-.63.3-1.25.6-1.88.89-.67.31-1.34.13-1.61-.43-.29-.59-.04-1.3.63-1.62,1.25-.6,2.51-1.18,3.78-1.74.83-.36,1.69.18,1.67,1.07Z\"/>\n        <path d=\"M214.15,154.62c.67,0,1.34,0,2.01,0,.73,0,1.18.43,1.2,1.1.02.63-.44,1.14-1.12,1.15-1.47.02-2.94.01-4.41-.01-.55,0-.95-.47-.99-1.04-.03-.57.35-1.1.91-1.15.51-.05,1.03-.03,1.54-.03.29,0,.57,0,.86,0h0Z\"/>\n        <path d=\"M252.27,164.57c.01-.79.7-1.31,1.38-1.15.23.05.45.15.67.25,1.03.48,2.05.97,3.08,1.46.1.05.19.1.29.15.65.35.91.98.64,1.51-.3.59-1.01.82-1.67.51-1.01-.47-2-.96-3-1.44-.3-.15-.6-.29-.89-.46-.35-.21-.49-.54-.49-.82Z\"/>\n        <path d=\"M248.88,169.6c.3,0,.57.08.79.29.91.83,1.77,1.71,2.62,2.6.45.48.41,1.16-.03,1.58-.44.42-1.13.43-1.59,0-.88-.84-1.75-1.7-2.61-2.56-.36-.36-.45-.78-.25-1.25.2-.46.6-.62,1.07-.65Z\"/>\n        <path d=\"M224.47,170.75c.02.24-.1.46-.28.64-.9.89-1.8,1.79-2.72,2.66-.44.42-1.09.42-1.49.03-.45-.43-.53-1.08-.13-1.55.82-.97,1.77-1.81,2.69-2.68.08-.07.18-.12.27-.17.78-.37,1.65.17,1.65,1.06Z\"/>\n      </g>\n      <g>\n        <path class=\"st4\" d=\"M236.3,153.57s2.58-4.38,5.72-1.72c2.97,2.52-1.91,7.83-5.79,9.24h-.08c-3.88-1.41-9.11-6.21-5.79-9.24,3.19-2.91,5.94,1.72,5.94,1.72Z\"/>\n        <g>\n          <g>\n            <line class=\"st8\" x1=\"243.48\" y1=\"150.22\" x2=\"244.18\" y2=\"149.57\"/>\n            <line class=\"st8\" x1=\"241.76\" y1=\"149.38\" x2=\"242.34\" y2=\"147.72\"/>\n            <line class=\"st8\" x1=\"239.69\" y1=\"149.15\" x2=\"239.64\" y2=\"147.77\"/>\n            <line class=\"st8\" x1=\"237.71\" y1=\"149.87\" x2=\"237.28\" y2=\"149.05\"/>\n            <line class=\"st8\" x1=\"244.54\" y1=\"151.82\" x2=\"245.74\" y2=\"151.4\"/>\n            <line class=\"st8\" x1=\"244.7\" y1=\"153.53\" x2=\"245.5\" y2=\"153.75\"/>\n            <line class=\"st8\" x1=\"244.11\" y1=\"155.49\" x2=\"245.24\" y2=\"156.15\"/>\n          </g>\n          <line class=\"st8\" x1=\"229.12\" y1=\"150.18\" x2=\"228.5\" y2=\"149.45\"/>\n          <line class=\"st8\" x1=\"230.86\" y1=\"149.34\" x2=\"230.48\" y2=\"147.63\"/>\n          <line class=\"st8\" x1=\"232.95\" y1=\"149.03\" x2=\"233.16\" y2=\"147.66\"/>\n          <line class=\"st8\" x1=\"235.09\" y1=\"150.03\" x2=\"235.62\" y2=\"149.27\"/>\n          <line class=\"st8\" x1=\"227.95\" y1=\"151.59\" x2=\"226.81\" y2=\"151.03\"/>\n          <line class=\"st8\" x1=\"227.53\" y1=\"153.27\" x2=\"226.71\" y2=\"153.4\"/>\n          <line class=\"st8\" x1=\"227.7\" y1=\"155.28\" x2=\"226.5\" y2=\"155.81\"/>\n          <line class=\"st8\" x1=\"230\" y1=\"159.01\" x2=\"229.11\" y2=\"159.91\"/>\n          <line class=\"st8\" x1=\"228.52\" y1=\"157.26\" x2=\"228.06\" y2=\"157.68\"/>\n          <line class=\"st8\" x1=\"242.23\" y1=\"158.87\" x2=\"243.15\" y2=\"159.74\"/>\n          <line class=\"st8\" x1=\"243.52\" y1=\"157.39\" x2=\"244.01\" y2=\"157.77\"/>\n          <line class=\"st8\" x1=\"240.78\" y1=\"160.56\" x2=\"241.07\" y2=\"160.92\"/>\n          <line class=\"st8\" x1=\"238.71\" y1=\"162.07\" x2=\"239.08\" y2=\"162.57\"/>\n          <line class=\"st8\" x1=\"236.22\" y1=\"162.78\" x2=\"236.2\" y2=\"163.71\"/>\n          <line class=\"st8\" x1=\"231.23\" y1=\"161.13\" x2=\"231.63\" y2=\"160.66\"/>\n          <line class=\"st8\" x1=\"233.47\" y1=\"162.59\" x2=\"233.72\" y2=\"162.03\"/>\n        </g>\n      </g>\n    </g>\n  </g>\n  <g>\n    <polygon class=\"st5\" points=\"165.39 107.09 165.34 154.6 184.84 154.6 184.84 133.88 211.71 133.88 211.71 107.09 165.39 107.09\"/>\n    <line class=\"st5\" x1=\"185.22\" y1=\"120.31\" x2=\"196.46\" y2=\"120.31\"/>\n  </g>\n  <g>\n    <polygon class=\"st2\" points=\"158.72 154.64 154.68 107.45 119.45 107.45 115.41 154.64 158.72 154.64\"/>\n    <line class=\"st10\" x1=\"137.06\" y1=\"141.17\" x2=\"137.06\" y2=\"154\"/>\n  </g>\n  <path class=\"st9\" d=\"M151.29,135.17s2.59,2.57,2.46,3.25-4.19.19-6.26-.84\"/>\n  <path class=\"st9\" d=\"M143.92,140.59c-3.03,7.78-3.15,6.29-5.79-.39l5.31-.99\"/>\n  <path class=\"st9\" d=\"M136.58,140.27c-2.94,5.09-4.65,9.73-5.61-.43\"/>\n  <path class=\"st9\" d=\"M128.9,138.82c-4.39,5.11-6.77,6.8-5.04-2.03\"/>\n  <path class=\"st0\" d=\"M150.72,134.65s-12.82,12.08-28.69.51\"/>\n  <g>\n    <g>\n      <path class=\"st11\" d=\"M143.62,139.28c-.31,9.48,17.88,24.05,27.08,11.76,1.59-2.14,3.43-6.03,1.38-8.49-6.8-7.14-16.69,6.42-24.85-4.47l-3.62,1.2Z\"/>\n      <path class=\"st3\" d=\"M145.28,139.1s6.07,11.83,15.78,9\"/>\n    </g>\n    <g>\n      <line class=\"st1\" x1=\"176.28\" y1=\"141.65\" x2=\"180.68\" y2=\"138.99\"/>\n      <line class=\"st1\" x1=\"173.59\" y1=\"138.43\" x2=\"175.3\" y2=\"135.04\"/>\n      <line class=\"st1\" x1=\"169.55\" y1=\"136.43\" x2=\"169.58\" y2=\"134.52\"/>\n      <line class=\"st1\" x1=\"176.85\" y1=\"145.49\" x2=\"180.49\" y2=\"146.24\"/>\n      <line class=\"st1\" x1=\"175.92\" y1=\"149.89\" x2=\"177.48\" y2=\"150.68\"/>\n    </g>\n  </g>\n  <g>\n    <rect class=\"st5\" x=\"69.06\" y=\"107.45\" width=\"43.5\" height=\"47.16\"/>\n    <g>\n      <line class=\"st5\" x1=\"85.23\" y1=\"124.53\" x2=\"70.25\" y2=\"118.77\"/>\n      <line class=\"st5\" x1=\"110.28\" y1=\"143.65\" x2=\"95.3\" y2=\"137.88\"/>\n    </g>\n  </g>\n  <path class=\"st7\" d=\"M138.32,122.05s-.42.27-.56-.1c-.17-.44-1.25-6.6-1.25-6.6l-3.75,11.72s-.18.59.4.29l3-1.54,1.54,6.65,3.77-11.97-3.15,1.55Z\"/>\n  <g>\n    <path class=\"st15\" d=\"M51.85,124.28s1.42-12.18,2.96-15.77c0,0-1.88-.23-2.11-1.02s.97-4.33.97-4.33c5.74,1.65,3.93,2.44,5.29-3.13l4.04.63-.83,4.37s2.48.88,3.33.77l1.02-4.61,4.23.64s-.37,2.89-1.28,4.48c9-.43,11.77,13.09-4.48,11.53,7.62-.45,18.02,12.75-.26,13.57l-1.02,5.25c-4.74,1.14-4.14-2.96-3.2-5.38l-3.71-.77-1.02,4.74c-4.9.93-3.79-4.38-3.3-6.42,0,0-3.97-.53-4.48-1.44,0,0,.28-3.02.74-3.93l3.12.81Z\"/>\n    <path d=\"M62.24,137.54c-1.01,0-1.79-.31-2.33-.92-1.13-1.29-.73-3.46-.3-4.83l-2.29-.47-.88,4.08c-.06.27-.27.47-.54.52-1.59.3-2.8.03-3.6-.8-1.37-1.44-.99-4.19-.66-5.72-1.61-.26-3.74-.77-4.25-1.67-.07-.12-.1-.26-.08-.4.03-.32.31-3.17.81-4.17.14-.29.47-.43.78-.35l2.36.62c.32-2.57,1.39-10.72,2.62-14.4-.73-.19-1.62-.58-1.84-1.35-.26-.9.6-3.61.98-4.73.12-.34.48-.54.83-.44,1.11.32,1.95.61,2.56.82.45.15.9.31,1.14.36.06-.2.12-.58.18-.96.11-.68.26-1.61.56-2.86.08-.34.42-.57.77-.51l4.04.63c.18.03.35.13.45.28.11.15.15.34.11.52l-.72,3.79c.73.23,1.5.44,2.01.52l.9-4.06c.08-.35.41-.58.77-.53l4.23.64c.37.06.62.39.57.76-.01.1-.27,2.09-.9,3.73,2.59.19,4.85,1.5,6.05,3.58,1.1,1.91,1.09,4.09-.03,5.83-.76,1.18-2.51,2.88-6.43,3.42,1.71.93,3.26,2.29,4.3,3.89,1.29,1.98,1.53,3.97.69,5.6-.85,1.66-3.25,3.7-9.81,4.09l-.92,4.73c-.05.26-.25.47-.51.53-.6.14-1.14.22-1.63.22ZM56.8,129.83s.09,0,.14.01l3.71.77c.2.04.36.17.46.34.1.18.11.38.04.57-.55,1.42-.93,3.37-.21,4.19.46.53,1.38.51,2.19.37l.94-4.81c.06-.31.32-.54.64-.55,4.93-.22,8.2-1.42,9.2-3.38.82-1.6-.04-3.34-.62-4.24-1.47-2.25-4.18-4.02-6.67-4.48-.53-.02-1.09-.06-1.68-.11-.35-.03-.62-.33-.62-.69,0-.36.29-.65.64-.67.58-.03,1.18,0,1.79.11,4.25.13,7.35-.91,8.66-2.94.84-1.31.84-2.96,0-4.42-.87-1.5-2.87-3.06-5.89-2.92-.25.01-.48-.11-.61-.32-.13-.21-.13-.48-.01-.69.58-1.02.93-2.66,1.09-3.57l-2.92-.44-.89,3.99c-.06.28-.29.49-.57.53-.97.13-3.21-.65-3.65-.8-.32-.11-.5-.44-.44-.77l.69-3.68-2.72-.42c-.2.9-.31,1.6-.4,2.14-.17,1.06-.26,1.64-.79,1.96-.54.33-1.14.12-2.31-.28-.48-.16-1.09-.38-1.87-.61-.45,1.42-.82,2.94-.75,3.31.1.17.86.44,1.53.53.21.03.4.15.51.34.11.19.12.41.04.61-1.48,3.46-2.9,15.46-2.91,15.58-.02.2-.13.37-.29.48-.16.11-.36.15-.56.1l-2.51-.65c-.2.75-.37,1.99-.47,2.88.5.33,2.18.77,3.86,1,.19.03.36.13.47.29.11.16.15.36.1.54-.64,2.66-.59,4.4.15,5.19.39.41,1.04.57,1.92.47l.93-4.28c.07-.32.35-.54.66-.54Z\"/>\n    <path class=\"st12\" d=\"M56.91,115.29s-1.59.34-1.71.63,1.54,1.08,2.56,1.2\"/>\n    <path d=\"M57.77,117.41s-.02,0-.03,0c-.9-.1-2.48-.76-2.77-1.24-.1-.16-.07-.3-.04-.37.04-.11.17-.43,1.92-.81.16-.03.32.07.36.23.04.16-.07.32-.23.36-.55.12-1.09.28-1.36.4.38.28,1.42.74,2.19.83.17.02.29.17.27.33-.02.15-.15.27-.3.27ZM55.46,116.07s0,0,0,0h0Z\"/>\n    <path class=\"st12\" d=\"M58.39,119.1c-.73,3.65-.32,3.12,2.28,1.25l-1.76-1.65\"/>\n    <path d=\"M58.35,122.11c-.11,0-.2-.03-.29-.09-.42-.27-.36-.98.03-2.98.03-.16.19-.27.36-.24.16.03.27.19.24.36-.11.56-.4,2.02-.3,2.34.24-.04.92-.54,1.59-1.02.07-.05.14-.1.21-.15l-1.5-1.4c-.12-.11-.13-.31-.01-.43.11-.12.31-.13.43-.01l1.76,1.65c.07.06.1.15.1.24s-.05.17-.13.23c-.18.13-.35.25-.51.37-1,.73-1.57,1.14-1.98,1.14ZM58.41,121.54h0,0Z\"/>\n    <path class=\"st12\" d=\"M61.24,120.75c-.11,2.62-.58,4.77,2.22,1.2\"/>\n    <path d=\"M61.5,124.14c-.07,0-.14-.01-.2-.04-.54-.21-.49-1.06-.41-2.48.02-.28.03-.58.05-.88,0-.17.15-.3.32-.29.17,0,.3.15.29.32-.01.31-.03.61-.05.89-.04.7-.1,1.64.02,1.87.13-.03.54-.27,1.7-1.76.1-.13.29-.15.42-.05.13.1.15.29.05.42-1.23,1.57-1.8,2-2.2,2ZM61.53,123.55h0,0Z\"/>\n    <path class=\"st12\" d=\"M64.48,122.06c.43,2.98.92,4.19,2.39.46\"/>\n    <path d=\"M65.43,125.15s-.05,0-.07,0c-.56-.07-.86-.83-1.18-3.04-.02-.17.09-.32.26-.34.17-.02.32.09.34.26.3,2.06.54,2.47.66,2.53.02-.01.36-.14,1.15-2.14.06-.16.24-.23.39-.17.16.06.23.24.17.39-.71,1.8-1.2,2.52-1.73,2.52Z\"/>\n    <path d=\"M61.98,114.89c-.12,0-.23-.03-.34-.09-.32-.19-.43-.61-.24-.93.11-.18,2.61-4.41,5.67-4.61.37-.02.7.26.72.64.02.38-.26.7-.64.72-1.94.12-3.96,2.88-4.58,3.93-.13.22-.35.34-.59.34Z\"/>\n    <path d=\"M65.79,113.86c-.18,0-.36-.07-.5-.21l-3.81-4.04c-.26-.27-.25-.7.03-.96.27-.26.7-.25.96.03l3.81,4.04c.26.27.25.7-.03.96-.13.12-.3.19-.47.19Z\"/>\n    <path class=\"st13\" d=\"M58.9,118.7c-2.73,4.01-14.69,4.5-14.8-3.36-.01-1.37.4-3.53,1.99-3.93,4.98-.89,4.99,7.71,11.67,5.69l1.14,1.59Z\"/>\n    <path d=\"M51.81,122.12c-1.12,0-2.25-.15-3.3-.47-3.17-.95-4.94-3.19-4.98-6.31-.01-1.88.62-4.04,2.43-4.49.01,0,.03,0,.04,0,2.59-.46,3.99,1.28,5.34,2.97,1.53,1.92,2.98,3.73,6.26,2.74.24-.07.49.02.63.22l1.14,1.59c.14.2.14.46,0,.66-1.31,1.92-4.42,3.1-7.57,3.1ZM46.22,111.98c-1.23.33-1.55,2.26-1.54,3.36.05,3.29,2.29,4.66,4.16,5.22,3.29.99,7.66.08,9.35-1.87l-.66-.92c-.6.15-1.15.22-1.66.22-2.67,0-4.18-1.88-5.43-3.45-1.24-1.55-2.31-2.89-4.22-2.56Z\"/>\n    <path d=\"M53.66,119.71c-1.77,0-3.68-.53-5.07-2.34-.17-.23-.13-.55.09-.72.23-.17.55-.13.72.09,2.88,3.74,8.57.95,8.63.92.26-.13.57-.02.69.23.13.26.02.57-.23.69-.04.02-2.3,1.12-4.84,1.12Z\"/>\n    <path d=\"M67.12,123.03c-8.47,0-10.49-7.56-10.51-7.64-.09-.35.12-.71.48-.8.35-.09.71.12.8.48.08.3,1.94,7.09,10.02,6.62.36-.02.68.26.7.62.02.36-.26.68-.62.7-.3.02-.59.03-.87.03Z\"/>\n    <path d=\"M43.37,111.37c-.19,0-.37-.08-.5-.23l-1.49-1.75c-.24-.28-.2-.69.07-.93.28-.24.69-.2.93.07l1.49,1.75c.24.28.2.69-.07.93-.12.11-.28.16-.43.16Z\"/>\n    <path d=\"M44.97,110.38c-.32,0-.6-.23-.65-.56l-.25-1.68c-.05-.36.19-.7.55-.75.36-.05.7.19.75.55l.25,1.68c.05.36-.19.7-.55.75-.03,0-.07,0-.1,0Z\"/>\n    <path d=\"M46.96,110.1c-.06,0-.13,0-.2-.03-.35-.11-.54-.48-.43-.83l.25-.82c.11-.35.48-.54.83-.43.35.11.54.48.43.83l-.25.82c-.09.28-.35.46-.63.46Z\"/>\n    <path d=\"M42.59,112.92s-.05,0-.08,0l-1.65-.19c-.36-.04-.62-.37-.58-.73.04-.36.37-.62.73-.58l1.65.19c.36.04.62.37.58.73-.04.34-.32.58-.65.58Z\"/>\n    <path d=\"M41.59,115.04c-.32,0-.6-.24-.65-.56-.05-.36.2-.7.56-.75l.77-.11c.36-.05.7.2.75.56.05.36-.2.7-.56.75l-.77.11s-.07,0-.1,0Z\"/>\n  </g>\n</svg>", "lamp-aan": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"280\" height=\"315\" viewBox=\"0 0 280 315\" role=\"img\" aria-label=\"ZAPPER lamp aan\">\n <title>ZAPPER lamp aan</title>\n <desc>Haarscherpe ZAPPER vector-gloeilamp met lichtstralen. Volledig uit vectorpaden opgebouwd.</desc>\n <g fill=\"none\" stroke=\"#080808\" stroke-width=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path d=\"M 137 31 L 137 55\"/>\n  <path d=\"M 89 45 L 99 66\"/>\n  <path d=\"M 184 44 L 175 66\"/>\n  <path d=\"M 52 70 L 70 86\"/>\n  <path d=\"M 221 70 L 203 87\"/>\n  <path d=\"M 32 103 L 53 113\"/>\n  <path d=\"M 241 103 L 220 113\"/>\n  <path d=\"M 29 148 L 49 148\"/>\n  <path d=\"M 245 148 L 225 148\"/>\n  <path d=\"M 41 193 L 62 183\"/>\n  <path d=\"M 232 193 L 213 183\"/>\n  <path d=\"M 77 229 L 91 214\"/>\n  <path d=\"M 198 229 L 184 214\"/>\n </g>\n <!-- Clean, smoothed lightbulb silhouette with integral socket. -->\n <path fill=\"#080808\" d=\"M 137 78\n   C 99 78, 71 107, 71 142\n   C 71 165, 81 181, 96 197\n   C 102 204, 104 213, 104 220\n   Q 104 224, 108 226\n   L 108 258 Q 108 266, 116 266\n   C 122 275, 129 280, 137 280\n   C 145 280, 152 275, 159 266\n   Q 166 265, 166 258\n   L 166 226 Q 169 224, 170 217\n   C 171 207, 177 199, 185 190\n   C 197 177, 203 161, 203 143\n   C 203 107, 175 78, 137 78 Z\"/>\n <!-- Glass body, bold flat fill, faithfully following the cartoon bulb. -->\n <path fill=\"#FFD206\" d=\"M 137 89\n   C 107 89, 82 112, 82 143\n   C 82 162, 90 175, 105 191\n   C 112 199, 115 206, 115 213\n   L 159 213\n   C 159 204, 163 197, 171 189\n   C 186 174, 192 159, 192 143\n   C 192 113, 168 89, 137 89 Z\"/>\n <!-- Individual smooth heart-and-halo details. -->\n <g fill=\"none\" stroke=\"#080808\" stroke-width=\"4.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path d=\"M 101 120 L 97 116\"/>\n  <path d=\"M 108 117 L 105 111\"/>\n  <path d=\"M 116 113 L 114 106\"/>\n  <path d=\"M 125 111 L 123 104\"/>\n  <path d=\"M 136 111 L 136 103\"/>\n  <path d=\"M 146 111 L 148 104\"/>\n  <path d=\"M 157 113 L 161 107\"/>\n  <path d=\"M 166 116 L 172 111\"/>\n  <path d=\"M 175 122 L 181 119\"/>\n  <path d=\"M 179 131 L 187 130\"/>\n  <path d=\"M 179 143 L 188 143\"/>\n  <path d=\"M 174 156 L 181 160\"/>\n  <path d=\"M 164 166 L 169 172\"/>\n  <path d=\"M 149 176 L 151 181\"/>\n  <path d=\"M 137 179 L 137 185\"/>\n  <path d=\"M 123 175 L 119 181\"/>\n  <path d=\"M 109 165 L 104 169\"/>\n  <path d=\"M 99 153 L 93 155\"/>\n  <path d=\"M 96 141 L 90 142\"/>\n  <path d=\"M 97 130 L 90 128\"/>\n </g>\n <path fill=\"#EF2242\" stroke=\"#080808\" stroke-width=\"6\" stroke-linejoin=\"round\"\n   d=\"M 137 142\n      C 130 134, 125 130, 119 130\n      C 110 130, 106 136, 106 142\n      C 106 154, 125 167, 137 173\n      C 149 167, 169 154, 169 142\n      C 169 134, 164 130, 156 130\n      C 148 130, 143 135, 137 142 Z\"/>\n <!-- Horizontal purple threaded stripes and tiny purple glint at the tip. -->\n <g fill=\"#A000FF\">\n  <rect x=\"118\" y=\"224\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <rect x=\"118\" y=\"239\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <rect x=\"118\" y=\"254\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <path d=\"M 129 269 Q 137 274 145 269 Q 137 272 129 269 Z\"/>\n </g>\n</svg>\n", "lamp-uit": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"280\" height=\"315\" viewBox=\"0 0 280 315\" role=\"img\" aria-label=\"ZAPPER lamp uit\">\n <title>ZAPPER lamp uit</title>\n <desc>Haarscherpe ZAPPER vector-gloeilamp zonder lichtstralen. Volledig uit vectorpaden opgebouwd.</desc>\n <g fill=\"none\" stroke=\"#080808\" stroke-width=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n\n </g>\n <!-- Clean, smoothed lightbulb silhouette with integral socket. -->\n <path fill=\"#080808\" d=\"M 137 78\n   C 99 78, 71 107, 71 142\n   C 71 165, 81 181, 96 197\n   C 102 204, 104 213, 104 220\n   Q 104 224, 108 226\n   L 108 258 Q 108 266, 116 266\n   C 122 275, 129 280, 137 280\n   C 145 280, 152 275, 159 266\n   Q 166 265, 166 258\n   L 166 226 Q 169 224, 170 217\n   C 171 207, 177 199, 185 190\n   C 197 177, 203 161, 203 143\n   C 203 107, 175 78, 137 78 Z\"/>\n <!-- Glass body, bold flat fill, faithfully following the cartoon bulb. -->\n <path fill=\"#BFC1CB\" d=\"M 137 89\n   C 107 89, 82 112, 82 143\n   C 82 162, 90 175, 105 191\n   C 112 199, 115 206, 115 213\n   L 159 213\n   C 159 204, 163 197, 171 189\n   C 186 174, 192 159, 192 143\n   C 192 113, 168 89, 137 89 Z\"/>\n <!-- Individual smooth heart-and-halo details. -->\n <g fill=\"none\" stroke=\"#080808\" stroke-width=\"4.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path d=\"M 101 120 L 97 116\"/>\n  <path d=\"M 108 117 L 105 111\"/>\n  <path d=\"M 116 113 L 114 106\"/>\n  <path d=\"M 125 111 L 123 104\"/>\n  <path d=\"M 136 111 L 136 103\"/>\n  <path d=\"M 146 111 L 148 104\"/>\n  <path d=\"M 157 113 L 161 107\"/>\n  <path d=\"M 166 116 L 172 111\"/>\n  <path d=\"M 175 122 L 181 119\"/>\n  <path d=\"M 179 131 L 187 130\"/>\n  <path d=\"M 179 143 L 188 143\"/>\n  <path d=\"M 174 156 L 181 160\"/>\n  <path d=\"M 164 166 L 169 172\"/>\n  <path d=\"M 149 176 L 151 181\"/>\n  <path d=\"M 137 179 L 137 185\"/>\n  <path d=\"M 123 175 L 119 181\"/>\n  <path d=\"M 109 165 L 104 169\"/>\n  <path d=\"M 99 153 L 93 155\"/>\n  <path d=\"M 96 141 L 90 142\"/>\n  <path d=\"M 97 130 L 90 128\"/>\n </g>\n <path fill=\"#9C8391\" stroke=\"#080808\" stroke-width=\"6\" stroke-linejoin=\"round\"\n   d=\"M 137 142\n      C 130 134, 125 130, 119 130\n      C 110 130, 106 136, 106 142\n      C 106 154, 125 167, 137 173\n      C 149 167, 169 154, 169 142\n      C 169 134, 164 130, 156 130\n      C 148 130, 143 135, 137 142 Z\"/>\n <!-- Horizontal purple threaded stripes and tiny purple glint at the tip. -->\n <g fill=\"#79538F\">\n  <rect x=\"118\" y=\"224\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <rect x=\"118\" y=\"239\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <rect x=\"118\" y=\"254\" width=\"38\" height=\"5\" rx=\"2.5\"/>\n  <path d=\"M 129 269 Q 137 274 145 269 Q 137 272 129 269 Z\"/>\n </g>\n</svg>\n"}
STANDAARD_WACHTWOORD = "Bitcoin21"  # every lamp's default, until its owner changes it
# The board name a lamp reports, and the prefix of the image that belongs to it.
BOARDS = {"Zapper REV A": "zapper-reva", "ZapLamp REV A": "zapper-reva",
          "ESP32-C6-Zero + MOSFET": "lamp01"}
# Without a heartbeat from the page for this long, the tool stops by itself, so a
# desktop launch does not leave it running after the tab is closed.
STIL_NA = 120
LOGO = os.path.join(WORTEL, "assets", "logo", "zapper.svg")
BEKEND = os.path.expanduser("~/.config/zapper-control/bekend.json")
BACKUPS = os.path.expanduser("~/zapper-backups")

# Settings that may be changed from this tool, with their type. Anything else
# goes through "copy settings". Lamp mode is not a setting: see /api/lamp.
VELDEN = {
    "taal": str, "geluid": int, "nachtStart": int, "nachtEind": int, "nachtLampUit": bool,
    "rgbHelderheid": int, "rgbNacht": int, "minSats": int, "zapSeconden": int, "zapTempo": int,
    "meldUrl": str, "webhook": str, "lud16": str, "naam": str, "bedankNote": bool,
    "stapAan": bool, "stapSats": int, "doelAan": bool, "doelNaam": str, "doelSats": int,
    "doelDeuntje": bool, "deuntje": str, "zapDeuntje": str,
}


def schone_waarden(ruw):
    """Only known fields, converted to the right type; empty strings for numbers dropped."""
    uit = {}
    for k, v in (ruw or {}).items():
        soort = VELDEN.get(k)
        if soort is None or v is None:
            continue
        try:
            if soort is bool:
                uit[k] = v if isinstance(v, bool) else str(v).lower() in ("1", "true", "yes", "on")
            elif soort is int:
                if str(v).strip() == "":
                    continue
                uit[k] = int(v)
            else:
                uit[k] = str(v).strip()
        except (TypeError, ValueError):
            continue
    return uit


# ---------------------------------------------------------------- finding lamps

def _naam(n):
    uit = b""
    for deel in n.strip(".").split("."):
        uit += bytes([len(deel)]) + deel.encode()
    return uit + b"\0"


def _lees_naam(data, i):
    delen, sprong, terug = [], False, i
    while True:
        lengte = data[i]
        if lengte == 0:
            i += 1
            break
        if lengte & 0xC0 == 0xC0:  # pointer to an earlier name
            if not sprong:
                terug = i + 2
            i = ((lengte & 0x3F) << 8) | data[i + 1]
            sprong = True
            continue
        delen.append(data[i + 1:i + 1 + lengte].decode(errors="replace"))
        i += 1 + lengte
    return ".".join(delen), (terug if sprong else i)


def zoek_mdns(wachttijd=3.0):
    """Asks the network for _zapper._tcp.local. Sent from an ordinary port, so the
    lamps answer us directly (legacy unicast) and nothing else has to give up 5353."""
    vraag = struct.pack(">HHHHHH", 0, 0, 1, 0, 0, 0) + _naam("_zapper._tcp.local") + struct.pack(">HH", 12, 1)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 255)
    s.settimeout(0.3)
    gevonden = {}
    einde = time.time() + wachttijd
    volgende = 0
    while time.time() < einde:
        if time.time() >= volgende:  # ask three times: UDP may drop one
            s.sendto(vraag, ("224.0.0.251", 5353))
            volgende = time.time() + 1.0
        try:
            data, (afzender, _) = s.recvfrom(9000)
        except socket.timeout:
            continue
        try:
            lamp = _ontleed(data, afzender)
        except (IndexError, struct.error, UnicodeDecodeError):
            continue
        if lamp:
            gevonden[lamp["ip"]] = {**gevonden.get(lamp["ip"], {}), **lamp}
    s.close()
    return gevonden


def _ontleed(data, afzender):
    _, _, qd, an, ns, ar = struct.unpack(">HHHHHH", data[:12])
    i = 12
    for _ in range(qd):
        _, i = _lees_naam(data, i)
        i += 4
    lamp = {"ip": afzender}
    for _ in range(an + ns + ar):
        naam, i = _lees_naam(data, i)
        soort, _, _, lengte = struct.unpack(">HHIH", data[i:i + 10])
        i += 10
        rd = data[i:i + lengte]
        if soort == 33:  # SRV: the host name
            lamp["host"] = _lees_naam(data, i + 6)[0].removesuffix(".local")
        elif soort == 16 and "_zapper" in naam:  # TXT: name and version
            j = 0
            while j < len(rd):
                n = rd[j]
                k, _, v = rd[j + 1:j + 1 + n].decode(errors="replace").partition("=")
                lamp[k] = v
                j += 1 + n
        elif soort == 1 and lengte == 4:
            lamp["ip"] = socket.inet_ntoa(rd)
        i += lengte
    return lamp if ("host" in lamp or "versie" in lamp) else None


# ---------------------------------------------------------------- talking to a lamp

class Lamp:
    """One Zapper, with the password and session that work for it (memory only)."""

    def __init__(self, info):
        self.ip = info["ip"]
        self.info = {"ip": self.ip, "host": info.get("host", self.ip), "naam": info.get("naam", ""),
                     "versie": info.get("versie", ""), "board": info.get("board", ""), "mac": info.get("mac", ""),
                     "online": False, "toegang": False, "fout": "", "laatst": info.get("laatst", 0)}
        self.wachtwoord = STANDAARD_WACHTWOORD
        self.koek = None

    def _verzoek(self, pad, data=None, soort=None, tijd=10, methode=None):
        kop = {"Cookie": self.koek} if self.koek else {}
        if soort:
            kop["Content-Type"] = soort
        verzoek = urllib.request.Request(f"http://{self.ip}{pad}", data=data, headers=kop,
                                         method=methode or ("POST" if data is not None else "GET"))
        return urllib.request.urlopen(verzoek, timeout=tijd)

    def inloggen(self, wachtwoord=None):
        if wachtwoord:
            self.wachtwoord = wachtwoord
        self.koek = None
        if not self.wachtwoord:
            raise RuntimeError("password needed")
        antwoord = self._verzoek("/api/login", self.wachtwoord.encode(), "text/plain", 8)
        self.koek = antwoord.headers.get("Set-Cookie", "").split(";")[0] or None
        if not self.koek:
            raise RuntimeError("no session")

    def api(self, pad, data=None, soort=None, tijd=10, methode=None):
        """A call that logs in when needed, and once more when the session expired
        (after a restart). One session is reused, so the lamp's own logins stay."""
        for poging in (1, 2):
            try:
                if not self.koek:
                    self.inloggen()
                return self._verzoek(pad, data, soort, tijd, methode).read().decode(errors="replace")
            except urllib.error.HTTPError as e:
                if e.code in (401, 403) and poging == 1:
                    self.koek = None
                    continue
                raise RuntimeError(e.read().decode(errors="replace").strip() or f"HTTP {e.code}")

    def json(self, pad, tijd=10):
        return json.loads(self.api(pad, tijd=tijd))

    def post(self, pad, obj=None, tijd=10):
        return self.api(pad, json.dumps(obj or {}).encode(), "application/json", tijd)

    def bekijk(self, wachtwoord=None):
        """Fills in what the lamp itself reports. A new password logs in again."""
        try:
            if wachtwoord:
                self.inloggen(wachtwoord)
            st = self.json("/api/status")
            meting = st.get("meting") or {}
            mijlpaal = st.get("mijlpaal") or {}
            self.info.update(
                board=st.get("board", "?"), versie=st.get("versie", ""), host=st.get("host") or self.info["host"],
                mac=st.get("mac") or self.info.get("mac", ""), ssid=st.get("ssid", ""), rssi=st.get("rssi"),
                volt=st.get("volt"), zone=meting.get("zone"), relays=st.get("relaysOp"),
                zaps=st.get("zaps"), sats=st.get("sats"), uptime=st.get("uptime"),
                lampStand=st.get("lampStand"), lampNiveau=st.get("lampNiveau"), tempC=st.get("tempC"),
                stapNog=mijlpaal.get("nog") if mijlpaal.get("aan") else None,
                standaard=st.get("standaardWachtwoord"), online=True, toegang=True, fout="",
                laatst=int(time.time()))
            instel = self.json("/api/settings")
            self.info.update(naam=instel.get("naam", self.info["naam"]), buzzer=bool(instel.get("heeftBuzzer")),
                             deuntje=instel.get("deuntje"), deuntjes=instel.get("deuntjes") or [],
                             zapDeuntje=instel.get("zapDeuntje"),
                             stapAan=instel.get("stapAan"), stapSats=instel.get("stapSats"))
        except RuntimeError as e:
            fout = str(e)
            self.info.update(online=True, toegang=False,
                             fout="wrong password" if "HTTP 401" in fout or "HTTP 403" in fout else fout)
        except urllib.error.HTTPError as e:
            self.info.update(online=True, toegang=False, fout="wrong password" if e.code in (401, 403) else f"HTTP {e.code}")
        except (OSError, ValueError):
            self.koek = None
            self.info.update(online=False, toegang=False, fout="offline")
        return self.info

    def detail(self):
        """Everything the settings panel shows for this one lamp."""
        st = self.json("/api/status")
        instel = self.json("/api/settings")
        log = self.json("/api/log")[:30]
        velden = {k: instel.get(k) for k in VELDEN if k in instel}
        return {"ip": self.ip, "host": st.get("host"), "versie": st.get("versie"), "board": st.get("board"),
                "lampStand": st.get("lampStand"), "buzzer": bool(instel.get("heeftBuzzer")),
                "dimmer": bool(instel.get("kanDimmen")), "deuntjes": instel.get("deuntjes") or [],
                "doel": st.get("doel"), "mijlpaal": st.get("mijlpaal"), "zaps": st.get("zaps"),
                "sats": st.get("sats"), "grootste": st.get("grootste"), "uptime": st.get("uptime"),
                "mac": st.get("mac"), "tempC": st.get("tempC"), "rssiGem": st.get("rssiGem"),
                "herstartReden": st.get("herstartReden"), "npub": st.get("npub"),
                "velden": velden, "log": log}

    def upload(self, bestand):
        inhoud = open(bestand, "rb").read()
        grens = "----zapper" + str(int(time.time()))
        lijf = (f"--{grens}\r\n"
                f'Content-Disposition: form-data; name="f"; filename="firmware.bin"\r\n'
                f"Content-Type: application/octet-stream\r\n\r\n").encode() + inhoud + f"\r\n--{grens}--\r\n".encode()
        return self.api("/api/update", lijf, f"multipart/form-data; boundary={grens}", 180)

    def wacht_terug(self, eerst=8, keer=45):
        """After a restart: the version it runs once it answers again, or None."""
        time.sleep(eerst)
        for _ in range(keer):
            try:
                self.koek = None
                return self.json("/api/status").get("versie")
            except Exception:
                time.sleep(2)
        return None


# ---------------------------------------------------------------- the online update channel

# BIP340 signature check (as in nostr), only verify.
_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
_G = (0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
      0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8)


def _tag(tag, data):
    h = hashlib.sha256(tag.encode()).digest()
    return hashlib.sha256(h + h + data).digest()


def _add(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if a[0] == b[0] and a[1] != b[1]:
        return None
    if a == b:
        lam = (3 * a[0] * a[0] * pow(2 * a[1], _P - 2, _P)) % _P
    else:
        lam = ((b[1] - a[1]) * pow(b[0] - a[0], _P - 2, _P)) % _P
    x = (lam * lam - a[0] - b[0]) % _P
    return x, (lam * (a[0] - x) - a[1]) % _P


def _mul(p, n):
    r = None
    for i in range(256):
        if (n >> i) & 1:
            r = _add(r, p)
        p = _add(p, p)
    return r


def schnorr_klopt(pub, msg, sig):
    if len(pub) != 32 or len(msg) != 32 or len(sig) != 64:
        return False
    x = int.from_bytes(pub, "big")
    if x >= _P:
        return False
    y_sq = (pow(x, 3, _P) + 7) % _P
    y = pow(y_sq, (_P + 1) // 4, _P)
    if pow(y, 2, _P) != y_sq:
        return False
    punt = (x, y if y % 2 == 0 else _P - y)
    r, s_ = int.from_bytes(sig[:32], "big"), int.from_bytes(sig[32:], "big")
    if r >= _P or s_ >= _N:
        return False
    e = int.from_bytes(_tag("BIP0340/challenge", sig[:32] + pub + msg), "big") % _N
    rr = _add(_mul(_G, s_), _mul(punt, _N - e))
    return rr is not None and rr[1] % 2 == 0 and rr[0] == r


def haal(url, tijd=20):
    verzoek = urllib.request.Request(url, headers={"User-Agent": f"zapper-control/{CONTROL_VERSIE}"})
    return urllib.request.urlopen(verzoek, timeout=tijd).read()


def online_manifest(staat, vers=False):
    """The signed list of the newest versions, or None. Kept ten minutes."""
    if not vers and staat.get("online_tijd", 0) > time.time() - 600:
        return staat.get("online")
    staat["online_tijd"] = time.time()
    try:
        inhoud = haal(UPDATE_BRON + "manifest.json")
        sig = bytes.fromhex(haal(UPDATE_BRON + "manifest.sig").decode().strip())
        if not schnorr_klopt(bytes.fromhex(RELEASE_PUBKEY), hashlib.sha256(inhoud).digest(), sig):
            staat["online"], staat["online_fout"] = None, "the online update list has no valid signature"
            return None
        staat["online"], staat["online_fout"] = json.loads(inhoud), ""
    except (OSError, ValueError) as e:
        staat["online"], staat["online_fout"] = None, f"update channel not reachable ({e})"
    return staat["online"]


def download_geverifieerd(url, sha256, naam):
    """Downloads into the cache and checks the SHA-256 from the signed list."""
    os.makedirs(CACHE, exist_ok=True)
    pad = os.path.join(CACHE, naam)
    if os.path.exists(pad) and hashlib.sha256(open(pad, "rb").read()).hexdigest() == sha256:
        return pad
    data = haal(url, 120)
    if hashlib.sha256(data).hexdigest() != sha256:
        raise RuntimeError(f"{naam}: checksum does not match the signed list")
    with open(pad + ".nieuw", "wb") as f:
        f.write(data)
    os.replace(pad + ".nieuw", pad)
    return pad


def versie_doel(staat):
    """The newest firmware we can install: from the local release folder or online."""
    lokaal = versie_van(staat["map"])
    online = (staat.get("online") or {}).get("versie", "")
    return online if versie_tuple(online) > versie_tuple(lokaal) else lokaal


def image_beschikbaar(staat, board):
    doel = versie_doel(staat)
    online = staat.get("online") or {}
    if online.get("versie") == doel and board in (online.get("firmware") or {}):
        return True
    return bool(versie_van(staat["map"]) == doel and image_voor(staat["map"], board))


def image_pad(staat, board):
    """A local file with the image for this board, downloaded and checked when it comes from online."""
    doel = versie_doel(staat)
    online = staat.get("online") or {}
    fw = (online.get("firmware") or {}).get(board)
    if online.get("versie") == doel and fw:
        naam = fw["url"].rsplit("/", 1)[-1]
        return download_geverifieerd(fw["url"], fw["sha256"], naam)
    if versie_van(staat["map"]) == doel:
        return image_voor(staat["map"], board)
    return None


def control_update(staat):
    c = (staat.get("online") or {}).get("control") or {}
    nieuw = c.get("versie", "")
    return {"huidig": CONTROL_VERSIE, "nieuw": nieuw if versie_tuple(nieuw) > versie_tuple(CONTROL_VERSIE) else "",
            "kan": not IN_REPO}


def werk_zelf(staat):
    """Replaces this file with the newer, checked Zapper control and starts it again."""
    c = (staat.get("online") or {}).get("control") or {}
    nieuw = download_geverifieerd(c["url"], c["sha256"], "zapper-control.py")
    eigen = os.path.abspath(__file__)
    shutil.copyfile(nieuw, eigen + ".nieuw")
    os.replace(eigen + ".nieuw", eigen)

    def herstart():
        time.sleep(1)
        staat["server"].shutdown()
        staat["server"].server_close()
        os.execv(sys.executable, [sys.executable, eigen, *sys.argv[1:]])
    threading.Thread(target=herstart, daemon=True).start()


# ---------------------------------------------------------------- images

def nieuwste_map():
    mappen = [m for m in glob.glob(os.path.join(WORTEL, "dist", "zapper-*")) if os.path.isdir(m)]
    return max(mappen, key=lambda m: versie_tuple(os.path.basename(m))) if mappen else None


def image_voor(map_, board):
    prefix = BOARDS.get(board)
    if not prefix or not map_:
        return None
    gevonden = glob.glob(os.path.join(map_, f"{prefix}-*-ota.bin"))
    return gevonden[0] if gevonden else None


def versie_van(map_):
    return os.path.basename(map_).removeprefix("zapper-") if map_ else ""


def bron_versie():
    """The version the firmware source would build now."""
    try:
        m = re.search(r'#define FIRMWARE_VERSIE "([^"]+)"', open(os.path.join(WORTEL, "src", "versie.h")).read())
        return m.group(1) if m else None
    except OSError:
        return None


def versie_tuple(v):
    return tuple(int(x) for x in re.findall(r"\d+", v or ""))


def is_actueel(info, versie):
    """Up to date: the lamp runs this version or a newer one."""
    eigen = info.get("versie", "").split(" ")[0]
    return bool(versie) and bool(eigen) and versie_tuple(eigen) >= versie_tuple(versie)


# ---------------------------------------------------------------- Zappers seen before

def lees_bekend():
    try:
        return json.load(open(BEKEND))
    except (OSError, ValueError):
        return {}


def bewaar_bekend(staat):
    """Name, address and MAC of every Zapper seen, so one that is off still shows.
    No passwords, no keys."""
    data = {l.ip: {k: l.info.get(k) for k in ("host", "naam", "board", "mac", "versie", "laatst")}
            for l in staat["lampen"].values() if l.info.get("laatst")}
    try:
        os.makedirs(os.path.dirname(BEKEND), exist_ok=True)
        tijdelijk = BEKEND + ".nieuw"
        with open(tijdelijk, "w") as f:
            json.dump(data, f, indent=1)
        os.replace(tijdelijk, BEKEND)
    except OSError:
        pass


# ---------------------------------------------------------------- jobs

class Klus:
    """One job on the selected lamps, run in the background; the page follows the lines."""

    def __init__(self):
        self.regels = []
        self.bezig = False
        self.slot = threading.Lock()

    def meld(self, tekst):
        with self.slot:
            self.regels.append(time.strftime("%H:%M:%S ") + tekst)
        print(tekst, flush=True)

    def per_lamp(self, lampen, titel, werk):
        """Runs werk(lamp) for each lamp in turn; one failing does not stop the rest."""
        self.bezig = True
        self.meld(f"{titel}: {len(lampen)} Zapper{'' if len(lampen) == 1 else 's'}")
        goed = 0
        for lamp in lampen:
            naam = lamp.info["host"]
            try:
                uitkomst = werk(lamp)
                self.meld(f"{naam}: {uitkomst or 'OK'}")
                goed += 1
            except Exception as e:
                self.meld(f"{naam}: FAILED: {e}")
        self.meld(f"Done: {goed} of {len(lampen)} OK.")
        self.bezig = False


def werk_update(staat):
    versie = versie_doel(staat)

    def werk(lamp):
        bestand = image_pad(staat, lamp.info.get("board"))
        if not bestand:
            raise RuntimeError(f"no image for board {lamp.info.get('board')!r}")
        lamp.upload(bestand)
        nieuw = lamp.wacht_terug()
        if not nieuw or nieuw.split(" ")[0] != versie:
            raise RuntimeError(f"came back with version {nieuw or 'unknown'}")
        lamp.info["versie"] = nieuw
        return f"now runs {nieuw}"
    return werk


def werk_wifi(ssid, wachtwoord):
    def werk(lamp):
        # The lamp has to see the network itself, otherwise it would leave this one
        # for a network it cannot reach and drop into setup mode.
        lijst = json.loads(lamp.api("/api/scan?opnieuw=1", tijd=20) or "[]")
        if ssid not in {n.get("ssid") for n in lijst}:
            raise RuntimeError(f"'{ssid}' is not in range of this Zapper, nothing changed")
        lamp.post("/api/settings", {"ssid": ssid, "wpass": wachtwoord})
        lamp.post("/api/reboot")
        return f"set to '{ssid}', restarting. If the password is wrong it turns red; then hold SETUP 5 s."
    return werk


def werk_instellingen(waarden, publiceren):
    def werk(lamp):
        lamp.post("/api/settings", waarden)
        uit = "saved: " + ", ".join(sorted(waarden)) if waarden else "nothing to save"
        if publiceren:
            lamp.post("/api/publish", tijd=30)
            uit += "; profile published"
        return uit
    return werk


def werk_kopie(bron):
    export = json.loads(bron.api("/api/export"))

    def werk(lamp):
        if lamp is bron:
            return "source, left as it is"
        lamp.post("/api/settings", export)
        return f"settings of {bron.info['host']} applied"
    return werk


def werk_backup(map_):
    def werk(lamp):
        data = json.loads(lamp.api("/api/export"))
        pad = os.path.join(map_, f"{lamp.info['host']}.json")
        with open(pad, "w") as f:
            json.dump(data, f, indent=1, ensure_ascii=False)
        return f"saved to {pad}"
    return werk


def werk_eenvoudig(soort, extra=None):
    def werk(lamp):
        if soort == "herstart":
            lamp.post("/api/reboot")
            nieuw = lamp.wacht_terug(eerst=5)
            return "back online" if nieuw else "restarted, not back yet"
        if soort == "identificeer":
            lamp.post("/api/identify")
            return "blinking white"
        if soort == "testzap":
            lamp.post("/api/lamp?doe=test")
            return "test zap played"
        if soort == "stand":
            lamp.post(f"/api/lamp?doe={extra}")  # checked against auto/aan/uit by the caller
            return {"auto": "Automatic", "aan": "Always on", "uit": "Always off"}[extra]
        if soort == "nabootsen":
            lamp.post(f"/api/nabootsen?sats={int(extra)}")
            return f"simulated zap of {int(extra)} sats"
        if soort == "reset":
            lamp.post("/api/resetstats")
            return "counters set to 0"
        if soort == "publiceer":
            lamp.post("/api/publish", tijd=30)
            return "profile and relay list published"
        if soort == "zelftest":
            d = lamp.json("/api/zelftest", tijd=20)
            tot = d.get("geslaagd", 0) + d.get("mislukt", 0)
            if d.get("mislukt"):
                fout = [c["naam"] for c in d.get("controles", []) if not c.get("ok")]
                raise RuntimeError(f"self-test {d['geslaagd']}/{tot}, failed: {', '.join(fout)}")
            return f"self-test {d['geslaagd']}/{tot}"
        raise RuntimeError(f"unknown action {soort}")
    return werk


def werk_verdeel(staat, lampen):
    """Gives each selected lamp a tune no other lamp on the network has yet."""
    bezet = {l.info.get("deuntje") for l in staat["lampen"].values() if l not in lampen and l.info.get("buzzer")}
    vrij = [d["id"] for d in (lampen[0].info.get("deuntjes") or []) if d["id"] not in bezet]

    def werk(lamp):
        if not lamp.info.get("buzzer"):
            return "no buzzer on this board, left as it is"
        eigen = [d["id"] for d in lamp.info.get("deuntjes") or []]
        keuze = next((t for t in vrij if t in eigen), None)
        if not keuze:
            raise RuntimeError("no unused tune left on this firmware")
        vrij.remove(keuze)
        lamp.post("/api/settings", {"deuntje": keuze})
        lamp.info["deuntje"] = keuze
        naam = next((d["naam"] for d in lamp.info["deuntjes"] if d["id"] == keuze), keuze)
        return f"now plays {naam}"
    return werk


def werk_speel_na_elkaar():
    """Plays each lamp's own tune, one lamp after the other, so you hear them all."""
    def werk(lamp):
        if not lamp.info.get("buzzer"):
            return "no buzzer on this board"
        lamp.post("/api/lamp?doe=feest")
        d = next((d for d in lamp.info.get("deuntjes") or [] if d["id"] == lamp.info.get("deuntje")), None)
        time.sleep((d["ms"] if d else 4000) / 1000 + 0.8)
        return f"played {d['naam'] if d else 'its tune'}"
    return werk


def bouw_images(klus, staat):
    klus.bezig = True
    klus.meld("Building the images from the source, this takes about half a minute")
    try:
        proces = subprocess.Popen([os.path.join(WORTEL, "tools", "maak-release.sh")], cwd=WORTEL,
                                  stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for regel in proces.stdout:
            regel = regel.rstrip()
            if regel and ("SUCCESS" in regel or "FAILED" in regel or "rror" in regel):
                klus.meld(regel)
        if proces.wait() == 0:
            staat["map"] = nieuwste_map()
            klus.meld(f"Done: images for {versie_van(staat['map'])} are ready.")
        else:
            klus.meld("Building FAILED. Run the release build in a terminal to see why.")
    except OSError as e:
        klus.meld(f"Building FAILED: {e}")
    klus.bezig = False


# ---------------------------------------------------------------- finding and listing

def bekijk_alle(lampen):
    draden = [threading.Thread(target=l.bekijk) for l in lampen]
    for d in draden:
        d.start()
    for d in draden:
        d.join()


def verzamel(staat, zoeken=True):
    """Looks on the network (zoeken) and refreshes every known lamp. A lamp that
    got a new address keeps one card: it is matched on its MAC address."""
    with staat["slot"]:
        if zoeken:
            for info in zoek_mdns().values():
                if info["ip"] not in staat["lampen"]:
                    staat["lampen"][info["ip"]] = Lamp(info)
        bekijk_alle(list(staat["lampen"].values()))
        per_mac = {}
        for ip, l in sorted(staat["lampen"].items(), key=lambda x: -x[1].info.get("laatst", 0)):
            mac = (l.info.get("mac") or "").lower()
            if mac and mac in per_mac and not l.info["online"]:
                del staat["lampen"][ip]  # the same Zapper, now at another address
            elif mac:
                per_mac[mac] = ip
        bewaar_bekend(staat)
    return lijst(staat)


def lijst(staat):
    uit = []
    for l in sorted(staat["lampen"].values(), key=lambda l: (not l.info.get("online"), l.info["host"])):
        info = {k: v for k, v in l.info.items()}
        info["image"] = image_beschikbaar(staat, info.get("board"))
        info["eigenWachtwoord"] = l.wachtwoord != STANDAARD_WACHTWOORD
        # for "open this lamp, already logged in" (lamps from 1.10 read it after the #)
        info["sessie"] = (l.koek or "").partition("=")[2] if (l.koek or "").startswith("sid=") else ""
        uit.append(info)
    return uit


def live_standen(staat, lampen=None):
    """What each lamp is doing right now: level, and how long it still blinks.
    /api/lampstand needs no login and is what the lamp's own page polls."""
    uit = {}

    def een(l):
        try:
            d = json.loads(urllib.request.urlopen(f"http://{l.ip}/api/lampstand", timeout=1.5).read())
            uit[l.ip] = {"niveau": d.get("niveau", 0), "knippert": d.get("knippert", 0), "periode": d.get("periode", 400)}
            l.info["lampNiveau"] = d.get("niveau", 0)
        except (OSError, ValueError):
            pass
    lijst_ = lampen or [l for l in staat["lampen"].values() if l.info.get("online")]
    draden = [threading.Thread(target=een, args=(l,)) for l in lijst_]
    for d in draden:
        d.start()
    for d in draden:
        d.join()
    return uit


def netten(staat):
    """Network names the lamps can see, from the first lamp that answers."""
    for lamp in staat["lampen"].values():
        if lamp.info.get("toegang"):
            try:
                return sorted({n.get("ssid") for n in json.loads(lamp.api("/api/scan", tijd=20)) if n.get("ssid")})
            except Exception:
                continue
    return []


# ---------------------------------------------------------------- the page

PAGINA = r"""<!doctype html><html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>Zapper control</title>
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<style>
/* Zapper control. The colours come straight from the ZAPPER logo: the purple of
   its tile (#9d00f9, nostr's colour too), its orange (#ff7f00, #ef8d25), the
   yellow of the bulb (#fbc808) and the red of the heart (#ed1f33). Everything
   else is glass, light and space. */
:root{
  --purple:#9d00f9;--purple2:#b84dff;--violet:#6a00c8;--orange:#ff7f00;--amber:#ef8d25;--yellow:#fbc808;--red:#ed1f33;--pink:#ec4899;
  --ink:#f7f3ff;--soft:#c2b6dc;--quiet:#9286ad;--dim:#665b80;
  --night:#0b0517;--glass:rgba(34,18,58,.62);--glass2:rgba(255,255,255,.055);--field:rgba(8,3,18,.5);
  --hair:rgba(255,255,255,.08);--hair2:rgba(255,255,255,.14);
  --green:#30d158;--okText:#7ef0a0;--warnText:#ffbe5c;--errText:#ff8f86;
  --r-xl:28px;--r-l:22px;--r-m:16px;--r-s:12px;
  --brand:linear-gradient(120deg,var(--purple) 0%,#d23cff 38%,var(--orange) 78%,var(--yellow) 100%);
  --knop:linear-gradient(135deg,var(--purple) 0%,#c41dd8 55%,var(--orange) 130%);
  --font:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,system-ui,sans-serif;
  --display:-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter","Segoe UI",Roboto,system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;background:var(--night);scroll-behavior:smooth}
body{margin:0;color:var(--ink);font:15px/1.5 var(--font);-webkit-font-smoothing:antialiased;min-height:100vh;background:var(--night);overflow-x:hidden}
/* the sky: a purple aurora on top, the orange of the logo low on the right,
   a faint grid of relay dots, all drifting slowly */
body::before{content:"";position:fixed;inset:-25vmax;z-index:-2;pointer-events:none;
  background:
    radial-gradient(38vmax 30vmax at 14% 4%,rgba(157,0,249,.55),transparent 64%),
    radial-gradient(30vmax 22vmax at 62% 12%,rgba(210,60,255,.20),transparent 66%),
    radial-gradient(36vmax 28vmax at 94% 92%,rgba(255,127,0,.36),transparent 62%),
    radial-gradient(24vmax 18vmax at 70% 70%,rgba(251,200,8,.08),transparent 70%),
    radial-gradient(30vmax 24vmax at 6% 96%,rgba(106,0,200,.30),transparent 70%);
  animation:zweef 30s ease-in-out infinite alternate}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);background-size:26px 26px;
  -webkit-mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 75%);mask-image:radial-gradient(ellipse at 50% 0%,#000 0%,transparent 75%)}
@keyframes zweef{to{transform:translate3d(3vmax,-2vmax,0) rotate(2deg) scale(1.05)}}
button,input,select{font-family:inherit;color:inherit}
a{color:var(--amber)}
.wrap{max-width:1180px;margin:0 auto;padding:max(18px,env(safe-area-inset-top)) 22px calc(80px + env(safe-area-inset-bottom))}
.verborgen{display:none!important}
.zacht{color:var(--quiet)}

/* ---- top bar */
header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
.merk{display:flex;align-items:center;gap:14px;min-width:0}
.logo{width:54px;height:54px;border-radius:16px;flex:none;box-shadow:0 10px 30px -6px rgba(157,0,249,.8),0 0 0 1px rgba(255,255,255,.12)}
h1{font:800 26px/1.05 var(--display);margin:0;letter-spacing:-.03em;white-space:nowrap;
  background:var(--brand);-webkit-background-clip:text;background-clip:text;color:transparent}
.status{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px}
.stip{font-size:12.5px;font-weight:550;color:var(--quiet);display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.stip::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--dim)}
.stip.ok{color:var(--soft)}.stip.ok::before{background:var(--green);box-shadow:0 0 8px rgba(48,209,88,.8)}
.stip.warn{color:var(--warnText)}.stip.warn::before{background:var(--orange);box-shadow:0 0 8px rgba(255,127,0,.7)}
.stip.err{color:var(--errText)}.stip.err::before{background:var(--red);box-shadow:0 0 8px rgba(237,31,51,.7)}
.kopacties{display:flex;align-items:center;gap:10px;flex:none}
.taal{display:inline-flex;border:1px solid var(--hair2);background:rgba(255,255,255,.06);border-radius:99px;padding:3px;
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
.taal button{background:none;border:0;color:var(--soft);padding:6px 13px;cursor:pointer;font-size:13px;font-weight:650;min-height:32px;border-radius:99px}
.taal button.actief{background:var(--knop);color:#fff;box-shadow:0 3px 12px -2px rgba(157,0,249,.8)}
.ikoon{width:40px;height:40px;flex:none;border-radius:50%;display:inline-grid;place-items:center;padding:0;cursor:pointer;
  border:1px solid var(--hair2);background:rgba(255,255,255,.06);color:#d6cbea;transition:color .2s,background .2s,box-shadow .25s,transform .12s;
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
.ikoon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ikoon:hover{color:#fff;background:rgba(157,0,249,.25);box-shadow:0 0 0 1px rgba(184,77,255,.6),0 0 18px rgba(157,0,249,.45)}
.ikoon:active{transform:scale(.9)}
.ikoon.klein{width:34px;height:34px}.ikoon.klein svg{width:16px;height:16px}
.ikoon:disabled{opacity:.3;cursor:default;box-shadow:none;background:rgba(255,255,255,.04)}
.draait svg{animation:draai .9s linear infinite}@keyframes draai{to{transform:rotate(360deg)}}

/* ---- hero: the big lamp of the whole fleet, and the four numbers */
.held{position:relative;display:grid;grid-template-columns:auto 1fr;gap:30px;align-items:center;padding:26px 30px;margin-bottom:30px;
  border-radius:var(--r-xl);overflow:hidden;border:1px solid var(--hair);
  background:linear-gradient(135deg,rgba(157,0,249,.30),rgba(40,16,70,.55) 45%,rgba(255,127,0,.16));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 60px -24px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%)}
.held::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;padding:1px;
  background:linear-gradient(120deg,rgba(184,77,255,.7),transparent 35%,transparent 65%,rgba(255,127,0,.6));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.heldlamp{position:relative;width:150px;height:168px;display:grid;place-items:center}
.heldlamp img{grid-area:1/1;height:168px;width:auto;position:relative;transition:opacity .5s,filter .6s}
.heldlamp .aan{opacity:0;filter:drop-shadow(0 0 3px rgba(251,200,8,.8)) drop-shadow(0 0 16px rgba(255,127,0,.6)) drop-shadow(0 0 34px rgba(157,0,249,.55))}
.heldlamp .uit{filter:brightness(.8) saturate(.7) drop-shadow(0 0 2px rgba(255,255,255,.25))}
.heldlamp::before{content:"";position:absolute;left:50%;top:40%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;
  background:radial-gradient(circle,rgba(251,200,8,.55),rgba(255,127,0,.22) 45%,rgba(157,0,249,.12) 62%,transparent 72%);opacity:0;transition:opacity .6s}
.heldlamp.brandt .aan{opacity:1}.heldlamp.brandt .uit{opacity:0}
.heldlamp.brandt::before{opacity:1;animation:adem 4.6s ease-in-out infinite}
@keyframes adem{50%{opacity:.5;transform:scale(.94)}}
.heldtekst{min-width:0}
.heldtekst .tag{font:700 13px/1 var(--display);letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin:0 0 8px}
.heldtekst h2.groot{font:800 clamp(26px,3.4vw,38px)/1.08 var(--display);letter-spacing:-.035em;margin:0 0 18px;color:var(--ink)}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.stat{border-radius:var(--r-m);padding:13px 15px 14px;background:rgba(8,3,18,.32);border:1px solid rgba(255,255,255,.07)}
.stat .l{font-size:11px;color:var(--soft);text-transform:uppercase;letter-spacing:.08em;font-weight:650}
.stat .v{font:800 30px/1.1 var(--display);letter-spacing:-.035em;font-variant-numeric:tabular-nums;margin-top:5px;
  background:linear-gradient(120deg,#fff 0%,var(--yellow) 30%,var(--orange) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}

/* ---- section titles */
.sectie{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 0 14px}
h2{font:750 22px/1.2 var(--display);margin:0;letter-spacing:-.025em;color:var(--ink)}
h2 .accent{background:var(--brand);-webkit-background-clip:text;background-clip:text;color:transparent}
h3{font:700 13px/1.3 var(--display);margin:0 0 12px;color:var(--amber);letter-spacing:.06em;text-transform:uppercase}
.sectie p{margin:0;color:var(--quiet);font-size:13.5px}

/* ---- glass */
.kaart{background:var(--glass);border:1px solid var(--hair);border-radius:var(--r-l);padding:20px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 24px 50px -22px rgba(0,0,0,.75);
  -webkit-backdrop-filter:blur(26px) saturate(160%);backdrop-filter:blur(26px) saturate(160%)}
.hint{font-size:14px;color:var(--soft);margin:0 0 16px;line-height:1.55}

/* ---- round checkboxes */
.balk{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 14px}
.balk .teller{color:var(--soft);font-size:13.5px;font-variant-numeric:tabular-nums}
.vinkje{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none;color:var(--soft);font-size:14px;font-weight:550;position:relative;line-height:1}
.vinkje input{position:absolute;opacity:0;width:0;height:0}
.vinkje i{width:26px;height:26px;border-radius:50%;border:1.8px solid rgba(255,255,255,.3);background:rgba(8,3,18,.35);display:grid;place-items:center;transition:all .18s;flex:none}
.vinkje:hover i{border-color:rgba(184,77,255,.8)}
.vinkje input:checked+i{background:var(--knop);border-color:transparent;box-shadow:0 3px 14px -2px rgba(157,0,249,.9)}
.vinkje input:checked+i::after{content:"";width:6px;height:12px;border:solid #fff;border-width:0 2.4px 2.4px 0;transform:translateY(-1px) rotate(45deg)}
.vinkje input:focus-visible+i{outline:2px solid var(--purple2);outline-offset:2px}
.vinkje input:disabled+i{opacity:.25}

/* ---- the Zappers, one widget each, with its own lamp in the middle */
.lampen{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px;margin-bottom:38px;align-items:stretch}
.lamp{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:14px;padding:18px 18px 16px;overflow:hidden;
  transition:border-color .3s,box-shadow .3s,transform .25s;
  background:linear-gradient(170deg,rgba(157,0,249,.20),rgba(30,14,52,.62) 42%,rgba(20,9,36,.7))}
.lamp::before{content:"";position:absolute;left:50%;top:-30px;width:240px;height:200px;margin-left:-120px;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(251,200,8,.32),rgba(255,127,0,.14) 55%,transparent);opacity:0;transition:opacity .5s}
.lamp.brandt::before{opacity:1}
.lamp.brandt{border-color:rgba(255,160,40,.32)}
.lamp.gekozen{border-color:rgba(184,77,255,.75);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1px rgba(157,0,249,.55),0 0 40px -8px rgba(157,0,249,.7),0 24px 50px -22px rgba(0,0,0,.75)}
.lamp.zapt{animation:zapgloed .5s ease-in-out infinite alternate}
@keyframes zapgloed{to{box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1px rgba(251,200,8,.7),0 0 46px -4px rgba(255,127,0,.85)}}
.lamp.offline{opacity:.72;gap:12px;background:linear-gradient(170deg,rgba(80,70,100,.16),rgba(20,12,32,.7))}
.offrij{display:flex;align-items:center;gap:14px}
.offlijst{grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));align-items:start}
.offlamp img{height:52px;width:auto;display:block;filter:brightness(.7) saturate(.5)}
.offrij .lampnaam{flex:1;text-align:left}
.offrij .lampnaam b{font-size:18px}
.rood{color:var(--errText);font-weight:650}
.lampbalk{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}
.lampbalk .knopjes{display:flex;gap:6px}
.lampknop{position:relative;z-index:1;align-self:center;width:118px;height:128px;display:grid;place-items:center;border:0;background:none;padding:0;cursor:pointer;border-radius:30px;
  transition:transform .15s}
.lampknop:hover{transform:scale(1.04)}.lampknop:active{transform:scale(.95)}
.lampknop:disabled{cursor:default;transform:none}
.lampknop:focus-visible{outline:2px solid var(--purple2);outline-offset:4px}
.lampknop img{grid-area:1/1;height:124px;width:auto;transition:opacity .12s linear,filter .4s}
.lampknop .aan{opacity:0;filter:drop-shadow(0 0 3px rgba(251,200,8,.85)) drop-shadow(0 0 12px rgba(255,127,0,.6)) drop-shadow(0 0 24px rgba(157,0,249,.5))}
.lampknop .uit{filter:brightness(.78) saturate(.65) drop-shadow(0 0 1px rgba(255,255,255,.3))}
.lampknop.aan .aan{opacity:1}.lampknop.aan .uit{opacity:0}
.zapbadge{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:2;font:800 12px/1 var(--display);letter-spacing:.08em;text-transform:uppercase;
  padding:6px 11px;border-radius:99px;background:linear-gradient(120deg,var(--yellow),var(--orange));color:#2a0f00;box-shadow:0 4px 18px rgba(255,127,0,.7)}
.lampnaam{position:relative;z-index:1;text-align:center;min-width:0}
.lampnaam b{display:block;font:750 21px/1.15 var(--display);letter-spacing:-.025em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lampnaam .sub{display:block;color:var(--soft);font-size:13.5px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Auto / On / Off as a small segmented control */
.seg{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:3px;border-radius:13px;background:rgba(8,3,18,.42);border:1px solid rgba(255,255,255,.07)}
.seg button{border:0;background:none;color:var(--soft);font-size:13px;font-weight:650;padding:7px 4px;border-radius:10px;cursor:pointer;min-height:34px;transition:background .2s,color .2s}
.seg button:hover{color:#fff}
.seg button.actief{color:#fff;background:var(--knop);box-shadow:0 3px 12px -2px rgba(157,0,249,.8)}
.seg button:disabled{opacity:.4;cursor:default}
.cijfers{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);border-radius:var(--r-s);background:rgba(8,3,18,.32);border:1px solid rgba(255,255,255,.06)}
.cijfers div{padding:9px 4px;text-align:center}
.cijfers div+div{border-left:1px solid rgba(255,255,255,.07)}
.cijfers b{display:block;font:750 17px/1.2 var(--display);letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--yellow)}
.cijfers span{font-size:10.5px;color:var(--soft);text-transform:uppercase;letter-spacing:.07em;font-weight:650}
.chips{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.chip{font-size:12px;font-weight:650;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.075);color:var(--soft);white-space:nowrap;font-variant-numeric:tabular-nums}
.chip.ok{background:rgba(48,209,88,.16);color:var(--okText)}
.chip.warn{background:rgba(255,127,0,.18);color:var(--warnText)}
.chip.err{background:rgba(237,31,51,.2);color:var(--errText)}
.chip.paars{background:rgba(157,0,249,.25);color:#e2c2ff}
.tunes{position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;border-radius:var(--r-s);background:rgba(8,3,18,.28);border:1px solid rgba(255,255,255,.06);padding:10px 10px 10px 12px;min-height:118px}
.tunerij{display:grid;grid-template-columns:78px 1fr;align-items:center;gap:8px;font-size:12.5px;font-weight:650;color:var(--soft)}
.tunerij select{min-height:40px;font-size:14px;padding:8px 32px 8px 11px}
.tunerij .klein{font-size:12px;font-weight:500}
.leegvak{justify-content:center;align-items:center;text-align:center;color:var(--quiet);font-size:13px}
.regel{display:flex;gap:8px;align-items:center}
.regel select,.regel input{flex:1;min-width:0}
.kaartvoet{position:relative;z-index:1;margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid var(--hair);font-size:12.5px}
.kaartvoet a{font-family:var(--mono);font-size:12px;color:var(--quiet);text-decoration:none}
.kaartvoet a:hover{color:var(--amber)}
.fout{position:relative;z-index:1;color:var(--errText);font-size:13.5px;text-align:center}
details.ww summary{cursor:pointer;color:var(--quiet);list-style:none;white-space:nowrap}
details.ww summary::-webkit-details-marker{display:none}
details.ww summary::before{content:"\25B8\00a0"}
details.ww[open] summary::before{content:"\25BE\00a0"}
details.ww[open]{flex-basis:100%}
details.ww input{margin-top:8px}
.kaartvoet:has(details[open]){flex-wrap:wrap}

/* ---- fields */
label{display:block;font-size:13px;font-weight:600;color:var(--soft);margin:0 0 6px}
input,select{width:100%;padding:10px 13px;background:var(--field);border:1px solid rgba(255,255,255,.11);border-radius:var(--r-s);color:var(--ink);
  font-size:16px;min-height:44px;transition:border-color .15s,box-shadow .15s,background .15s;-webkit-appearance:none;appearance:none}
input:hover,select:hover{border-color:rgba(184,77,255,.45)}
select{background-image:url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%23c2b6dc' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 13px center;background-size:11px;padding-right:36px}
select option{background:#1d0f33}
input:focus,select:focus{outline:0;border-color:var(--purple2);box-shadow:0 0 0 4px rgba(157,0,249,.32)}
input::placeholder{color:#7d7097}
.velden{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,232px),1fr));gap:16px 18px;margin-bottom:18px}
.velden .breed{grid-column:1/-1}

/* ---- buttons: the logo's purple running into its orange */
.knop{background:var(--knop);color:#fff;border:0;padding:11px 20px;border-radius:14px;font-weight:650;cursor:pointer;font-size:15px;min-height:44px;letter-spacing:-.01em;
  box-shadow:0 8px 24px -8px rgba(157,0,249,.9),inset 0 1px 0 rgba(255,255,255,.25);transition:filter .15s,transform .1s,box-shadow .2s}
.knop:hover{filter:brightness(1.08) saturate(1.1);box-shadow:0 10px 30px -8px rgba(196,29,216,.95),inset 0 1px 0 rgba(255,255,255,.25)}
.knop:active{transform:scale(.97)}
.knop.grijs{background:rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}
.knop.grijs:hover{background:rgba(157,0,249,.22)}
.knop.rood{background:rgba(237,31,51,.2);color:#ffa39b;box-shadow:none}
.knop.rood:hover{background:rgba(237,31,51,.32)}
.knop.klein{padding:7px 13px;min-height:34px;font-size:13.5px;border-radius:11px}
.knop:disabled{opacity:.4;cursor:default;filter:none;transform:none}
.knoppen{display:flex;gap:10px;flex-wrap:wrap}

/* ---- tabs: one segmented control, scrollable on a phone */
nav{display:flex;gap:3px;margin:0 0 16px;padding:4px;border-radius:18px;background:rgba(255,255,255,.055);border:1px solid var(--hair);
  overflow-x:auto;scrollbar-width:none;-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px)}
nav::-webkit-scrollbar{display:none}
nav button{flex:none;background:none;border:0;color:var(--soft);padding:9px 16px;cursor:pointer;font-size:14px;font-weight:650;border-radius:14px;min-height:40px;white-space:nowrap;transition:background .2s,color .2s}
nav button:hover{color:#fff}
nav button.actief{color:#fff;background:var(--knop);box-shadow:0 4px 16px -4px rgba(157,0,249,.9)}
.paneel{display:none}.paneel.actief{display:block;animation:in .28s cubic-bezier(.2,.8,.2,1)}
@keyframes in{from{opacity:0;transform:translateY(6px)}}
.let{border:1px solid rgba(255,127,0,.35);background:linear-gradient(120deg,rgba(255,127,0,.18),rgba(157,0,249,.14));padding:12px 16px;border-radius:var(--r-m);
  margin:0 0 24px;font-size:14px;color:#fde7cf;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.log{font:12.5px/1.75 var(--mono);color:#d8d2e6;white-space:pre-wrap;max-height:320px;overflow:auto;margin:0}
.log .goed{color:var(--okText)}.log .slecht{color:var(--errText)}.log .kop{color:var(--amber)}
.leeg{color:var(--quiet);text-align:center;padding:36px 12px}
footer{margin-top:36px;text-align:center;color:var(--dim);font-size:12px}
footer b{background:var(--brand);-webkit-background-clip:text;background-clip:text;color:transparent}

/* ---- the floating bar when Zappers are selected */
.zwevend{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translate(-50%,140%);z-index:15;display:flex;align-items:center;gap:12px;
  padding:8px 8px 8px 18px;border-radius:99px;background:rgba(30,14,52,.86);border:1px solid var(--hair2);
  box-shadow:0 20px 50px rgba(0,0,0,.6),0 0 40px -10px rgba(157,0,249,.8);-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);
  transition:transform .35s cubic-bezier(.2,.9,.25,1.2);white-space:nowrap;font-weight:650;font-size:14px}
.zwevend.zichtbaar{transform:translate(-50%,0)}
.zwevend .knop{min-height:38px;padding:8px 16px;border-radius:99px}

/* ---- the settings sheet of one Zapper */
dialog{border:0;padding:0;background:transparent;color:var(--ink);width:min(740px,calc(100vw - 20px));max-height:calc(100vh - 28px);margin:auto}
dialog[open]{animation:sheet .32s cubic-bezier(.2,.85,.25,1)}
@keyframes sheet{from{opacity:0;transform:translateY(22px) scale(.98)}}
dialog::backdrop{background:rgba(6,2,14,.66);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.paneelkaart{background:rgba(27,12,46,.94);border:1px solid var(--hair2);border-radius:var(--r-xl);
  box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 70px -24px rgba(157,0,249,.7);display:flex;flex-direction:column;max-height:calc(100vh - 28px);overflow:hidden;
  -webkit-backdrop-filter:blur(30px) saturate(160%);backdrop-filter:blur(30px) saturate(160%)}
.paneelkop{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid var(--hair);
  background:linear-gradient(120deg,rgba(157,0,249,.32),rgba(60,20,90,.2) 55%,rgba(255,127,0,.16))}
.paneelkop .lampnaam{text-align:left;flex:1}
.paneelkop .lampnaam b{font-size:22px}
.mini{position:relative;width:48px;height:54px;flex:none;display:grid;place-items:center}
.mini img{height:54px;width:auto;filter:brightness(.78) saturate(.65)}
.mini.brandt img{filter:drop-shadow(0 0 3px rgba(251,200,8,.8)) drop-shadow(0 0 10px rgba(255,127,0,.55))}
.paneelinhoud{overflow:auto;padding:20px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}
.paneelinhoud .kaart{background:rgba(255,255,255,.04);box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;padding:18px;border-radius:var(--r-m)}
.paneelinhoud .velden{margin-bottom:14px}
.paneelvoet{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 20px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--hair);background:rgba(8,3,18,.35)}
.paneelvoet .zacht{font-size:13px}
.voortgang{height:8px;border-radius:99px;background:rgba(8,3,18,.5);overflow:hidden;margin:4px 0 8px}
.voortgang i{display:block;height:100%;background:var(--brand);border-radius:99px;box-shadow:0 0 14px rgba(255,127,0,.55)}
.logregels{font-size:12.5px;max-height:230px;overflow:auto}
.logregels div{display:grid;grid-template-columns:4.6em 4.6em 1fr;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.logregels .t{color:var(--dim);font-variant-numeric:tabular-nums}.logregels .s{color:var(--amber)}
.gegevens{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:13.5px;margin:0}
.gegevens dt{color:var(--quiet)}.gegevens dd{margin:0;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.melding{position:fixed;left:50%;top:calc(18px + env(safe-area-inset-top));transform:translateX(-50%);background:rgba(36,16,60,.92);border:1px solid var(--hair2);
  padding:10px 20px;border-radius:99px;box-shadow:0 14px 40px rgba(0,0,0,.55),0 0 30px -8px rgba(157,0,249,.8);font-weight:650;font-size:14px;z-index:30;
  max-width:calc(100vw - 32px);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px)}

/* ---- phone */
@media (max-width:820px){
  .held{grid-template-columns:1fr;justify-items:center;text-align:center;padding:24px 18px;gap:14px}
  .heldlamp{width:120px;height:134px}.heldlamp img{height:134px}
  .heldtekst h2.groot{margin-bottom:14px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));text-align:left}
}
@media (max-width:560px){
  .wrap{padding:max(14px,env(safe-area-inset-top)) 14px calc(96px + env(safe-area-inset-bottom))}
  header{margin-bottom:16px}
  h1{font-size:22px}.logo{width:44px;height:44px;border-radius:13px}.merk{gap:11px}
  .status{gap:1px 10px}.taal button{padding:6px 10px}
  .sectie{flex-direction:column;align-items:flex-start;gap:3px}
  .kaart{padding:16px}.stat .v{font-size:25px}
  .let .knop{width:100%}
  dialog{width:100vw;max-width:100vw;max-height:94vh;margin:auto auto 0}
  .paneelkaart{border-radius:26px 26px 0 0;max-height:94vh}
  dialog[open]{animation:omhoog .34s cubic-bezier(.2,.85,.25,1)}
}
@keyframes omhoog{from{transform:translateY(40%);opacity:.4}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style></head><body><div class="wrap">

<header>
 <div class="merk"><img class="logo" src="/logo.svg" alt="">
  <div><h1>Zapper control</h1><div class="status" id="status"><span class="stip" data-t="zoeken"></span></div></div></div>
 <div class="kopacties">
  <span class="taal"><button data-taal="nl">NL</button><button data-taal="en">EN</button></span>
  <button class="ikoon" id="zoek" data-t-title="zoekOpnieuw"><svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg></button></div>
</header>

<div class="let verborgen" id="controlLet"><span id="controlTekst"></span><button class="knop klein" id="controlKnop" data-t="bijwerkenKort"></button></div>
<div class="let verborgen" id="bouwlet"><span id="bouwtekst"></span><button class="knop klein" data-doe="bouw" data-t="bouwImages"></button></div>

<section class="held">
 <div class="heldlamp" id="heldlamp" aria-hidden="true"><img class="uit" src="/lamp-uit.svg" alt=""><img class="aan" src="/lamp-aan.svg" alt=""></div>
 <div class="heldtekst"><p class="tag" data-t="heldTag"></p><h2 class="groot" id="heldTitel" data-t="zoeken"></h2>
  <div class="stats">
   <div class="stat"><div class="l" data-t="online"></div><div class="v" id="tOnline">-</div></div>
   <div class="stat"><div class="l" data-t="zapsTotaal"></div><div class="v" id="tZaps">-</div></div>
   <div class="stat"><div class="l" data-t="satsTotaal"></div><div class="v" id="tSats">-</div></div>
   <div class="stat"><div class="l" data-t="teUpdaten"></div><div class="v" id="tUpdate">-</div></div>
  </div></div>
</section>

<div class="sectie"><h2 data-t="zappersKop"></h2><p data-t="zappersUit"></p></div>
<div class="balk"><label class="vinkje"><input type="checkbox" id="alles"><i></i><span data-t="allesKiezen"></span></label><span class="teller" id="teller"></span></div>
<div class="lampen" id="lampen"><div class="kaart leeg" data-t="zoeken"></div></div>
<div class="sectie verborgen" id="offKop"><h2 data-t="offlineKop"></h2><p data-t="offlineUit"></p></div>
<div class="lampen offlijst" id="offline"></div>

<div class="sectie" id="acties"><h2 data-t="bulkKop"></h2><p data-t="bulkUit"></p></div>
<nav id="tabs">
 <button data-tab="firmware" class="actief" data-t="tFirmware"></button><button data-tab="snel" data-t="tSnel"></button>
 <button data-tab="feest" data-t="tFeest"></button><button data-tab="instellingen" data-t="tInstellingen"></button>
 <button data-tab="kopie" data-t="tKopie"></button><button data-tab="wifi" data-t="tWifi"></button><button data-tab="backup" data-t="tBackup"></button>
</nav>

<section class="kaart paneel actief" data-paneel="firmware">
 <p class="hint" data-t="firmwareUit"></p>
 <div class="knoppen"><button class="knop" data-doe="update" data-t="bijwerken"></button><button class="knop grijs" data-doe="bouw" data-t="bouwImages"></button></div>
</section>

<section class="kaart paneel" data-paneel="snel">
 <p class="hint" data-t="snelUit"></p>
 <div class="knoppen" style="margin-bottom:18px">
  <button class="knop grijs" data-doe="identificeer" data-t="welke"></button><button class="knop grijs" data-doe="testzap" data-t="testzap"></button>
  <button class="knop grijs" data-doe="zelftest" data-t="zelftest"></button><button class="knop grijs" data-doe="publiceer" data-t="publiceer"></button>
  <button class="knop grijs" data-doe="herstart" data-t="herstart"></button><button class="knop rood" data-doe="reset" data-t="tellersNul"></button></div>
 <div class="velden" style="margin-bottom:0">
  <div><label data-t="lampstand"></label><div class="regel"><select id="stand"><option value="auto" data-t="auto"></option><option value="aan" data-t="altijdAan"></option><option value="uit" data-t="altijdUit"></option></select>
   <button class="knop grijs" data-doe="stand" data-t="zet"></button></div></div>
  <div><label data-t="nepZap"></label><div class="regel"><input id="nepSats" type="number" min="1" value="21000" inputmode="numeric">
   <button class="knop grijs" data-doe="nabootsen" data-t="bootsNa"></button></div></div></div>
</section>

<section class="kaart paneel" data-paneel="feest">
 <p class="hint" data-t="feestUit"></p>
 <div class="velden">
  <div><label data-t="mijlpalen"></label><select data-v="stapAan" data-bool><option value="" data-t="laat"></option><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
  <div><label data-t="stapSats"></label><input data-v="stapSats" data-num type="number" min="100" placeholder="21000"></div>
  <div><label data-t="doelAan"></label><select data-v="doelAan" data-bool><option value="" data-t="laat"></option><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
  <div><label data-t="doelNaam"></label><input data-v="doelNaam" maxlength="60"></div>
  <div><label data-t="doelSats"></label><input data-v="doelSats" data-num type="number" min="1"></div>
  <div><label data-t="doelDeuntje"></label><select data-v="doelDeuntje" data-bool><option value="" data-t="laat"></option><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
 </div>
 <div class="knoppen"><button class="knop" data-doe="feestinstellingen" data-t="toepassen"></button>
  <button class="knop grijs" data-doe="verdeel" data-t="verdeel"></button><button class="knop grijs" data-doe="speelrij" data-t="speelrij"></button></div>
</section>

<section class="kaart paneel" data-paneel="instellingen">
 <p class="hint" data-t="instUit"></p>
 <div class="velden">
  <div><label data-t="taalL"></label><select data-v="taal"><option value="" data-t="laat"></option><option value="en">English</option><option value="nl">Nederlands</option></select></div>
  <div><label data-t="zapGeluid"></label><select data-v="zapDeuntje" id="bZapDeuntje"></select></div>
  <div><label data-t="zoemer"></label><select data-v="geluid" data-num><option value="" data-t="laat"></option><option value="2" data-t="zoemerAlles"></option><option value="1" data-t="zoemerGeenZap"></option><option value="0" data-t="zoemerStil"></option></select></div>
  <div><label data-t="nachtVan"></label><input data-v="nachtStart" data-num type="number" min="0" max="23" data-t-ph="uur"></div>
  <div><label data-t="nachtTot"></label><input data-v="nachtEind" data-num type="number" min="0" max="23" data-t-ph="uur"></div>
  <div><label data-t="nachtUit"></label><select data-v="nachtLampUit" data-bool><option value="" data-t="laat"></option><option value="1" data-t="ja"></option><option value="0" data-t="nee"></option></select></div>
  <div><label data-t="ledDag"></label><input data-v="rgbHelderheid" data-num type="number" min="0" max="255" data-t-ph="bereik255"></div>
  <div><label data-t="ledNacht"></label><input data-v="rgbNacht" data-num type="number" min="0" max="255" data-t-ph="bereik255"></div>
  <div><label data-t="minSats"></label><input data-v="minSats" data-num type="number" min="0" placeholder="sats"></div>
  <div><label data-t="knipperTijd"></label><input data-v="zapSeconden" data-num type="number" min="1" max="60" data-t-ph="seconden"></div>
  <div><label data-t="bedankje"></label><select data-v="bedankNote" data-bool><option value="" data-t="laat"></option><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
  <div><label data-t="lud16"></label><input data-v="lud16" placeholder="you@example.com"></div>
  <div><label data-t="meldUrl"></label><input data-v="meldUrl" placeholder="https://ntfy.sh/…"></div>
  <div><label>Webhook</label><input data-v="webhook" placeholder="https://"></div>
 </div>
 <label class="vinkje" style="margin-bottom:16px"><input type="checkbox" id="publiceer"><i></i><span data-t="publiceerNa"></span></label>
 <div class="knoppen"><button class="knop" data-doe="instellingen" data-t="toepassen"></button></div>
</section>

<section class="kaart paneel" data-paneel="kopie">
 <p class="hint" data-t="kopieUit"></p>
 <div class="velden"><div><label data-t="kopieVan"></label><select id="bron"></select></div></div>
 <div class="knoppen"><button class="knop" data-doe="kopie" data-t="kopieer"></button></div>
</section>

<section class="kaart paneel" data-paneel="wifi">
 <p class="hint" data-t="wifiUit"></p>
 <div class="velden">
  <div><label data-t="netwerk"></label><input id="ssid" list="netten" data-t-ph="netwerkNaam" autocomplete="off"><datalist id="netten"></datalist></div>
  <div><label data-t="wachtwoord"></label><input id="wpass" type="password" autocomplete="off"></div></div>
 <div class="knoppen"><button class="knop" data-doe="wifi" data-t="verhuis"></button></div>
</section>

<section class="kaart paneel" data-paneel="backup">
 <p class="hint" data-t="backupUit"></p>
 <div class="knoppen"><button class="knop" data-doe="backup" data-t="maakBackup"></button></div>
</section>

<section style="margin-top:28px"><div class="sectie"><h2 data-t="activiteit"></h2><p id="bezig"></p></div>
 <div class="kaart"><pre class="log" id="log"></pre></div></section>

<footer><b>Zapper control</b> · <span data-t="voet"></span></footer>
</div>

<dialog id="paneel"><div class="paneelkaart">
 <div class="paneelkop">
  <div class="mini" id="pLamp"><img src="/lamp-uit.svg" alt="" id="pLampImg"></div>
  <div class="lampnaam"><b id="pNaam"></b><span class="sub" id="pSub"></span></div>
  <button class="ikoon klein" id="pSluit" data-t-title="sluiten"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
 <div class="paneelinhoud" id="pInhoud">
  <section class="kaart"><h3 data-t="pLamp"></h3>
   <div class="velden">
    <div><label data-t="lampstand"></label><select id="pStand"><option value="auto" data-t="auto"></option><option value="aan" data-t="altijdAan"></option><option value="uit" data-t="altijdUit"></option></select></div>
    <div><label data-t="minSats"></label><input data-p="minSats" type="number" min="0" inputmode="numeric"></div>
    <div><label data-t="knipperTijd"></label><input data-p="zapSeconden" type="number" min="1" max="60" inputmode="numeric"></div>
    <div><label data-t="nachtVan"></label><input data-p="nachtStart" type="number" min="0" max="23" inputmode="numeric"></div>
    <div><label data-t="nachtTot"></label><input data-p="nachtEind" type="number" min="0" max="23" inputmode="numeric"></div>
    <div><label data-t="nachtUit"></label><select data-p="nachtLampUit" data-bool><option value="1" data-t="ja"></option><option value="0" data-t="nee"></option></select></div>
    <div><label data-t="ledDag"></label><input data-p="rgbHelderheid" type="number" min="0" max="255" inputmode="numeric"></div>
    <div><label data-t="ledNacht"></label><input data-p="rgbNacht" type="number" min="0" max="255" inputmode="numeric"></div>
    <div><label data-t="taalL"></label><select data-p="taal"><option value="en">English</option><option value="nl">Nederlands</option></select></div>
   </div></section>

  <section class="kaart" id="pGeluid"><h3 data-t="pFeest"></h3>
   <div class="velden">
    <div class="pBuzzer"><label data-t="zoemer"></label><select data-p="geluid" data-num><option value="2" data-t="zoemerAlles"></option><option value="1" data-t="zoemerGeenZap"></option><option value="0" data-t="zoemerStil"></option></select></div>
    <div class="pBuzzer"><label data-t="zapGeluid"></label><div class="regel"><select data-p="zapDeuntje" id="pZapDeuntje"></select>
     <button class="ikoon" id="pZapSpeel" data-t-title="speel"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div></div>
    <div class="pBuzzer"><label data-t="deuntje"></label><div class="regel"><select data-p="deuntje" id="pDeuntje"></select>
     <button class="ikoon" id="pSpeel" data-t-title="speel"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
     <button class="ikoon" id="pStil" data-t-title="stop"><svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg></button></div></div>
    <div class="pBuzzer"><label data-t="doelDeuntje"></label><select data-p="doelDeuntje" data-bool><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
    <div><label data-t="mijlpalen"></label><select data-p="stapAan" data-bool><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
    <div><label data-t="stapSats"></label><input data-p="stapSats" type="number" min="100" inputmode="numeric"></div>
    <div class="breed" id="pStapVak"><div class="voortgang"><i id="pStapBalk" style="width:0"></i></div><span class="hint" id="pStapTekst"></span>
     <button class="knop grijs klein" id="pStapNul" data-t="telOpnieuw" style="margin-left:6px"></button></div>
    <div><label data-t="doelAan"></label><select data-p="doelAan" data-bool><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
    <div><label data-t="doelSats"></label><input data-p="doelSats" type="number" min="1" inputmode="numeric"></div>
    <div class="breed"><label data-t="doelNaam"></label><input data-p="doelNaam" maxlength="60"></div>
    <div class="breed" id="pDoelVak"><div class="voortgang"><i id="pDoelBalk" style="width:0"></i></div><span class="hint" id="pDoelTekst"></span>
     <button class="knop grijs klein" id="pDoelNul" data-t="telOpnieuw" style="margin-left:6px"></button></div>
   </div></section>

  <section class="kaart"><h3 data-t="pProfiel"></h3>
   <div class="velden">
    <div><label data-t="profielNaam"></label><input data-p="naam" maxlength="60"></div>
    <div><label data-t="lud16"></label><input data-p="lud16" placeholder="you@example.com"></div>
    <div class="breed"><label data-t="meldUrl"></label><div class="regel"><input data-p="meldUrl" placeholder="https://ntfy.sh/…">
     <button class="knop grijs" id="pMeldTest" data-t="test"></button></div></div>
    <div><label data-t="bedankje"></label><select data-p="bedankNote" data-bool><option value="1" data-t="aan"></option><option value="0" data-t="uit"></option></select></div>
   </div>
   <div class="knoppen"><button class="knop grijs klein" data-een="publiceer" data-t="publiceer"></button></div></section>

  <section class="kaart"><h3 data-t="pActies"></h3>
   <div class="knoppen" style="margin-bottom:14px">
    <button class="knop grijs klein" data-een="identificeer" data-t="welke"></button><button class="knop grijs klein" data-een="testzap" data-t="testzap"></button>
    <button class="knop grijs klein" data-een="zelftest" data-t="zelftest"></button><button class="knop grijs klein" data-een="herstart" data-t="herstart"></button>
    <button class="knop rood klein" data-een="reset" data-t="tellersNul"></button></div>
   <div class="velden" style="margin-bottom:0"><div><label data-t="nepZap"></label><div class="regel"><input id="pNepSats" type="number" min="1" value="21000" inputmode="numeric">
    <button class="knop grijs" data-een="nabootsen" data-t="bootsNa"></button></div></div></div></section>

  <section class="kaart"><h3 data-t="pGegevens"></h3><dl class="gegevens" id="pGegevens"></dl></section>
  <section class="kaart"><h3 data-t="pLog"></h3><div class="logregels" id="pLog"></div></section>
 </div>
 <div class="paneelvoet"><span class="zacht" id="pVoet"></span><div class="knoppen">
  <a class="knop grijs" id="pOpen" target="_blank" rel="noopener" style="text-decoration:none;display:inline-grid;place-items:center" data-t="openLamp"></a>
  <button class="knop" id="pBewaar" data-t="opslaan"></button></div></div>
</div></dialog>
<div class="melding verborgen" id="melding"></div>
<div class="zwevend" id="zwevend"><span id="zwTekst"></span><button class="knop" id="zwKnop" data-t="naarActies"></button></div>

<script>
const TOKEN="%TOKEN%";
const $=id=>document.getElementById(id);
const T={
 zoeken:["Zappers zoeken…","Looking for Zappers…"],heldTag:["Jouw Zappers","Your Zappers"],firmwareOnline:["Firmware %v online","Firmware %v online"],
 kanaalWeg:["Updatekanaal niet bereikbaar","Update channel not reachable"],bijwerkenKort:["Bijwerken","Update"],
 controlNieuw:["Zapper control %n is uit (je hebt %h).","Zapper control %n is out (you have %h)."],controlBezig:["Zapper control wordt bijgewerkt en start opnieuw…","Zapper control is updating and starting again…"],offlineKop:["Offline","Offline"],
 offlineUit:["Eerder gezien. Zet ze aan, dan komen ze vanzelf terug.","Seen before. Switch them on and they come back by themselves."],
 allesOffline:["Alle bekende Zappers zijn nu offline.","All known Zappers are offline right now."],
 heldAlles:["Alle %n Zappers branden","All %n Zappers are on"],heldDeel:["%a van %n Zappers branden","%a of %n Zappers are on"],
 heldUit:["Alle Zappers zijn uit","All Zappers are off"],heldGeen:["Nog geen Zapper gevonden","No Zapper found yet"],heldEen:["Je Zapper brandt","Your Zapper is on"],
 tikLamp:["Tik om aan of uit te zetten","Tap to switch on or off"],zapNu:["Zap","Zap"],naarActies:["Acties","Actions"],
 zwGekozen:["%n gekozen","%n selected"],zoekOpnieuw:["Opnieuw zoeken op het netwerk","Search the network again"],
 bouwImages:["Images bouwen","Build images"],online:["Online","Online"],zapsTotaal:["Zaps samen","Zaps in total"],
 satsTotaal:["Sats samen","Sats in total"],teUpdaten:["Te updaten","To update"],
 zappersKop:["Zappers in je netwerk","Zappers on your network"],zappersUit:["Tik op het tandwiel voor alle instellingen van één Zapper.","Tap the gear for all settings of one Zapper."],
 allesKiezen:["Alles kiezen","Select all"],geenGekozen:["Niets gekozen","None selected"],gekozen:["%n van %m gekozen","%n of %m selected"],
 bulkKop:["Doen met de gekozen Zappers","Act on the selected Zappers"],bulkUit:["Eén voor één; het logboek onderaan laat elke stap zien.","One after the other; the log below shows each step."],
 tFirmware:["Firmware","Firmware"],tSnel:["Snelle acties","Quick actions"],tFeest:["Feestjes","Celebrations"],tInstellingen:["Instellingen","Settings"],
 tKopie:["Kopiëren","Copy settings"],tWifi:["Wifi","Wi-Fi"],tBackup:["Back-up","Backup"],
 firmwareUit:["Elke Zapper krijgt het image voor zijn eigen board uit de nieuwste release, en wordt na de herstart gecontroleerd op de nieuwe versie.","Each Zapper gets the image for its own board from the newest release, and is checked for the new version once it is back."],
 bijwerken:["Gekozen bijwerken","Update selected"],
 snelUit:["Op elke gekozen Zapper. Een nagebootste zap telt mee in de Zap stack, maar zet niets op nostr; handig om een doel of mijlpaal te testen.","On every selected Zapper. A simulated zap counts in the Zap stack but posts nothing on nostr; handy to test a goal or milestone."],
 welke:["Welke is dit","Which one is this"],testzap:["Testzap","Test zap"],zelftest:["Zelftest","Self-test"],publiceer:["Profiel publiceren","Publish profile"],
 herstart:["Herstarten","Restart"],tellersNul:["Tellers op 0","Counters to 0"],lampstand:["Lampstand","Lamp mode"],zet:["Zet","Set"],
 auto:["Automatisch","Automatic"],altijdAan:["Altijd aan","Always on"],altijdUit:["Altijd uit","Always off"],
 nepZap:["Zap nabootsen (sats)","Simulate a zap (sats)"],bootsNa:["Nabootsen","Simulate"],
 feestUit:["Bij elke stap sats viert de Zapper feest: regenboog, knipperen en zijn eigen deuntje. Het deuntje kies je op elke kaart, of geef hier iedere Zapper een ander.","At every step of sats the Zapper celebrates: a rainbow, blinking and its own tune. Choose the tune on each card, or give every Zapper a different one here."],
 mijlpalen:["Mijlpalen","Milestones"],stapSats:["Stap in sats","Step in sats"],doelAan:["Inzameldoel","Fundraising goal"],
 doelNaam:["Waarvoor","What for"],doelSats:["Doel in sats","Goal in sats"],doelDeuntje:["Deuntje bij het doel","Tune at the goal"],
 laat:["Laten zoals het is","Leave as it is"],aan:["Aan","On"],uit:["Uit","Off"],ja:["Ja","Yes"],nee:["Nee","No"],
 toepassen:["Toepassen op gekozen","Apply to selected"],verdeel:["Ieder een ander deuntje","Give each a different tune"],speelrij:["Deuntjes na elkaar spelen","Play their tunes in turn"],
 instUit:["Alleen wat je invult of kiest verandert; de rest blijft zoals het is.","Only what you fill in or choose changes; everything else stays as it is."],
 taalL:["Taal","Language"],zoemer:["Zoemer","Buzzer"],zoemerAlles:["Alles","Everything"],zoemerGeenZap:["Geen zappiep","No zap beep"],zoemerStil:["Stil","Silent"],
 nachtVan:["Nachtrust vanaf","Quiet hours from"],nachtTot:["Nachtrust tot","Quiet hours until"],nachtUit:["Lamp 's nachts uit","Lamp off at night"],
 uur:["Uur, 0 tot 23","Hour, 0 to 23"],bereik255:["0 tot 255","0 to 255"],seconden:["Seconden","Seconds"],ledDag:["Statuslampje overdag","Status light by day"],ledNacht:["Statuslampje 's nachts","Status light at night"],
 minSats:["Negeer zaps onder (sats)","Ignore zaps below (sats)"],knipperTijd:["Knippertijd per zap (s)","Blink time per zap (s)"],
 bedankje:["Bedankje op nostr","Thank-you note on nostr"],lud16:["Lightning-adres","Lightning address"],meldUrl:["Meldingen (ntfy-adres)","Alerts (ntfy address)"],
 publiceerNa:["Daarna het profiel publiceren (zet het op nostr; nodig na een nieuw lightning-adres)","Publish the profile afterwards (posts it on nostr; needed after a new lightning address)"],
 kopieUit:["Kopieert het instellingenbestand van één Zapper: taal, reactie, relays, profieltekst, doel, mijlpalen, meldingen en meer. Niet mee: naam, wachtwoord, sleutel, walletcode, stroomijking en deuntje.","Copies the settings file of one Zapper: language, how it reacts, relays, profile text, goal, milestones, alerts and more. Not copied: name, password, key, wallet code, current calibration and tune."],
 kopieVan:["Kopiëren van","Copy from"],kopieer:["Kopiëren naar gekozen","Copy to selected"],
 wifiUit:["Verhuist de gekozen Zappers naar een ander netwerk. Elke Zapper kijkt eerst of hij dat netwerk ziet, en blijft anders zoals hij is. Bij een verkeerd wachtwoord wordt hij rood en moet hij opnieuw ingesteld worden (SETUP 5 s). Zit deze pc niet op dat netwerk, dan verdwijnen ze uit de lijst.","Moves the selected Zappers to another network. Each first checks that it can see that network, and is otherwise left alone. With a wrong password it turns red and needs setting up again (SETUP 5 s). If this PC is not on that network, they disappear from the list."],
 netwerk:["Netwerk","Network"],netwerkNaam:["Naam van het netwerk","Name of the network"],wachtwoord:["Wachtwoord","Password"],verhuis:["Gekozen verhuizen","Move selected"],
 backupUit:["Bewaart het instellingenbestand van elke gekozen Zapper in ~/zapper-backups, in een map met de datum. Met Kopiëren, of in de webinterface van een Zapper, zet je het terug. Zonder sleutel en wachtwoorden.","Saves the settings file of every selected Zapper in ~/zapper-backups, in a folder with the date. Copy settings, or a Zapper's own web interface, puts it back. Without keys and passwords."],
 maakBackup:["Back-up maken","Make a backup"],activiteit:["Logboek","Activity"],nogNiets:["Nog niets gedaan.","Nothing done yet."],bezig:["Bezig…","Working…"],
 voet:["draait alleen op deze computer · stopt vanzelf als je deze pagina sluit","runs on this computer only · stops by itself after you close this page"],
 sluiten:["Sluiten","Close"],pLamp:["Lamp","Lamp"],pFeest:["Geluid en feestjes","Sound and celebrations"],deuntje:["Feestdeuntje","Celebration tune"],geenZoemer:["Geen zoemer op dit board, dus geen deuntjes.","No buzzer on this board, so no tunes."],
 updateVoorDeuntjes:["Update naar 1.6 of nieuwer voor deuntjes.","Update to 1.6 or newer for tunes."],vanaf17:["vanaf firmware 1.7","from firmware 1.7"],
 bijZap:["Bij een zap","On a zap"],bijFeest:["Feestje","Celebration"],piepKort:["Korte piep","Short beep"],zapGeluid:["Geluid bij een zap","Sound on a zap"],zapPiep:["Korte piep (standaard)","Short beep (default)"],speel:["Speel","Play"],stop:["Stop","Stop"],
 telOpnieuw:["Opnieuw vanaf 0","Count again from 0"],pProfiel:["Profiel en meldingen","Profile and alerts"],profielNaam:["Profielnaam","Profile name"],test:["Test","Test"],
 pActies:["Acties","Actions"],pGegevens:["Gegevens","Details"],pLog:["Logboek van deze Zapper","Event log of this Zapper"],openLamp:["Webinterface","Web interface"],opslaan:["Opslaan","Save"],
 offline:["Offline","Offline"],laatstGezien:["laatst gezien %t","last seen %t"],vergeet:["Vergeten","Forget"],geenToegang:["Geen toegang","No access"],
 fouteWw:["Verkeerd wachtwoord","Wrong password"],wwStandaard:["Wachtwoord: Bitcoin21","Password: Bitcoin21"],wwNodig:["Wachtwoord nodig","Password needed"],
 wwNodigUit:["Vul hieronder het wachtwoord van deze Zapper in. Werkt het, dan probeert Zapper control het ook bij je andere Zappers.","Enter this Zapper's password below. If it works, Zapper control tries it on your other Zappers too."],wwEigen:["Eigen wachtwoord in gebruik","Own password in use"],
 wwPh:["Wachtwoord van deze Zapper","Password of this Zapper"],hernoem:["Hernoemen","Rename"],instellingenVan:["Instellingen","Settings"],
 actueel:["actueel","up to date"],updateNaar:["update naar %v","update to %v"],nieuwer:["nieuwer dan de images","newer than the images"],
 relays:["%n relays","%n relays"],zaps:["Zaps","Zaps"],sats:["Sats","Sats"],lampAan:["lamp aan","lamp on"],lampUit:["lamp uit","lamp off"],
 nogTotStap:["%n sats tot de volgende mijlpaal van %s; al %k keer gevierd.","%n sats to the next milestone of %s; celebrated %k times."],
 doelStand:["%o van %d sats (%p%)","%o of %d sats (%p%)"],doelGehaald:["Gehaald: %o sats","Reached: %o sats"],
 geenZappers:["Geen Zappers gevonden. Staan ze aan, en op hetzelfde netwerk als deze computer?","No Zappers found. Are they on, and on the same network as this computer?"],
 statusN:["%n Zapper","%n Zapper"],statusNs:["%n Zappers","%n Zappers"],images:["Images %v","Images %v"],geenImages:["Geen images gebouwd","No images built"],
 achter:["%n te updaten","%n to update"],offlineN:["%n offline","%n offline"],
 bronNieuwer:["De broncode is versie %b, de images %v.","The source is at version %b, the images at %v."],bronGeenImages:["De broncode is versie %b; er zijn nog geen images.","The source is at version %b; no images are built yet."],
 kiesEerst:["Kies eerst minstens één Zapper.","Select at least one Zapper first."],eerstBouwen:["Bouw eerst de images.","Build the images first."],
 vraagUpdate:["%z bijwerken naar %v, één voor één?","Update %z to %v, one after the other?"],vraagHerstart:["%z herstarten?","Restart %z?"],
 vraagReset:["De tellers van %z op 0 zetten? Dat is niet terug te draaien.","Set the counters of %z to 0? This cannot be undone."],
 vraagInst:["%w toepassen op %z?","Apply %w to %z?"],vraagPubliceer:[", en het profiel publiceren,",", and publish the profile,"],
 vraagKopie:["De instellingen van %b kopiëren naar %z?","Copy the settings of %b to %z?"],vraagVerdeel:["%z ieder een deuntje geven dat geen andere Zapper hier heeft?","Give %z each a tune no other Zapper here has?"],
 vraagWifi:["%z verhuizen naar \"%s\"? Ze herstarten en verlaten dit netwerk.","Move %z to \"%s\"? They restart and leave this network."],
 vraagPub:["Het profiel van %z publiceren op nostr?","Publish the profile of %z on nostr?"],
 vulIets:["Vul minstens één instelling in.","Fill in or choose at least one setting."],vulNetwerk:["Vul de naam van het netwerk in.","Enter the name of the network."],
 nieuweNaam:["Nieuwe naam voor %h.\nLetters, cijfers en streepjes, bijvoorbeeld zapper07. Wordt http://<naam>.local","New name for %h.\nLetters, digits and hyphens, for example zapper07. It becomes http://<name>.local"],
 opgeslagen:["Opgeslagen","Saved"],nietsVeranderd:["Niets veranderd","Nothing changed"],verstuurd:["Verstuurd, kijk op je telefoon","Sent, check your phone"],
 laden:["Laden…","Loading…"],versie:["Versie","Version"],board:["Board","Board"],mac:["MAC","MAC"],temp:["Chiptemperatuur","Chip temperature"],
 wifiGem:["Wifi gemiddeld","Wi-Fi average"],aanSinds:["Aan sinds","Up for"],herstartReden:["Laatste herstart","Last restart"],grootste:["Grootste zap","Largest zap"],
 vraagDoelNul:["Het doel opnieuw tellen vanaf 0?","Count the goal again from 0?"],vraagStapNul:["De mijlpalen opnieuw tellen vanaf 0?","Count the milestones again from 0?"],
 dag:["d","d"],uurKort:["u","h"],minKort:["m","m"]
};
let taal='nl';
try{taal=localStorage.getItem('zc_taal')||((navigator.language||'').toLowerCase().startsWith('nl')?'nl':'en')}catch(e){}
const t=(k,v={})=>{let s=(T[k]||[k,k])[taal==='nl'?0:1];for(const x in v)s=s.split('%'+x).join(v[x]);return s};
const nf=x=>Number(x||0).toLocaleString(taal==='nl'?'nl-NL':'en-GB');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pasTaalToe(){
 document.documentElement.lang=taal;
 document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));
 document.querySelectorAll('[data-t-title]').forEach(e=>{e.title=t(e.dataset.tTitle);e.setAttribute('aria-label',e.title)});
 document.querySelectorAll('[data-t-ph]').forEach(e=>e.placeholder=t(e.dataset.tPh));
 document.querySelectorAll('[data-taal]').forEach(b=>b.classList.toggle('actief',b.dataset.taal===taal));
}
document.querySelectorAll('[data-taal]').forEach(b=>b.onclick=()=>{taal=b.dataset.taal;try{localStorage.setItem('zc_taal',taal)}catch(e){}
 pasTaalToe();if(lampen.length||geladen)toon(laatste);volg(true);if(paneelIp&&paneelData)vulPaneel(paneelData)});

async function post(pad,obj){const r=await fetch(pad,{method:'POST',headers:{'X-Token':TOKEN},body:JSON.stringify(obj||{})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.fout||('HTTP '+r.status));return d}
let meldTimer;function meld(s){const m=$('melding');m.textContent=s;m.classList.remove('verborgen');clearTimeout(meldTimer);meldTimer=setTimeout(()=>m.classList.add('verborgen'),2600)}

let lampen=[],versie='',bezig=false,laatste={lampen:[]},geladen=false,live={};
const gekozen=()=>[...document.querySelectorAll('[data-kies]:checked')].map(c=>c.dataset.kies);
const vergelijk=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);
 for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
const versieVan=l=>(l.versie||'').split(' ')[0];
const loopAchter=l=>l.toegang&&versie&&versieVan(l)&&vergelijk(versieVan(l),versie)<0;
function duur(s){if(s==null)return '';const d=Math.floor(s/86400),u=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
 return d?`${d}${t('dag')} ${u}${t('uurKort')}`:u?`${u}${t('uurKort')} ${m}${t('minKort')}`:`${m}${t('minKort')}`}
function geleden(ts){if(!ts)return '?';const d=new Date(ts*1000);return d.toLocaleString(taal==='nl'?'nl-NL':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
const IK={
 welke:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
 hernoem:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
 tandwiel:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 speel:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'};

function versieChip(l){const v=versieVan(l);if(!v)return '';if(!versie)return `<span class="chip">${esc(v)}</span>`;const c=vergelijk(v,versie);
 if(c===0)return `<span class="chip ok" title="${t('actueel')}">${esc(v)} \u2713</span>`;
 if(c<0)return `<span class="chip warn">${esc(v)} · ${t('updateNaar',{v:esc(versie)})}</span>`;
 return `<span class="chip paars" title="${t('nieuwer')}">${esc(v)} \u2191</span>`}
function staatChips(l){const c=[];
 if(l.rssi!=null)c.push(`<span class="chip ${l.rssi<-80?'warn':''}" title="${esc(l.ssid||'')}">Wi-Fi ${l.rssi} dBm</span>`);
 if(l.relays!=null)c.push(`<span class="chip ${l.relays?'':'err'}">${t('relays',{n:l.relays})}</span>`);
 if(l.volt!=null&&l.volt>=0)c.push(`<span class="chip ${['ok','warn','err'][l.zone]||''}">${Number(l.volt).toFixed(2)} V</span>`);
 return c.join('')}
// Always the same block, so every card has the same shape: two tune lists, or a
// short line saying why this Zapper has none.
function tuneBlok(l,id,tunes){
 if(!l.buzzer)return `<div class="tunes leegvak">${t('geenZoemer')}</div>`;
 if(!(l.deuntjes||[]).length)return `<div class="tunes leegvak">${t('updateVoorDeuntjes')}</div>`;
 const zap=l.zapDeuntje===undefined||l.zapDeuntje===null
  ?`<div class="tunerij"><span>${t('bijZap')}</span><span class="zacht klein">${t('vanaf17')}</span></div>`
  :`<div class="tunerij"><span>${t('bijZap')}</span><div class="regel"><select data-tune="${id}" data-veld="zapDeuntje"><option value="">${t('piepKort')}</option>${(l.deuntjes||[]).map(d=>`<option value="${esc(d.id)}" ${d.id===l.zapDeuntje?'selected':''}>${esc(d.naam)}</option>`).join('')}</select>
    <button class="ikoon klein" data-speel="${id}" data-veld="zapDeuntje" title="${t('speel')}" aria-label="${t('speel')}">${IK.speel}</button></div></div>`;
 return `<div class="tunes">${zap}
  <div class="tunerij"><span>${t('bijFeest')}</span><div class="regel"><select data-tune="${id}" data-veld="deuntje">${tunes}</select>
   <button class="ikoon klein" data-speel="${id}" data-veld="deuntje" title="${t('speel')}" aria-label="${t('speel')}">${IK.speel}</button></div></div></div>`}
function lampImg(){return '<img class="uit" src="/lamp-uit.svg" alt=""><img class="aan" src="/lamp-aan.svg" alt="">'}
function kaart(l,vink,ww,open){
 const id=esc(l.ip);
 if(!l.online)return `<article class="kaart lamp offline">
  <div class="offrij"><div class="offlamp" aria-hidden="true"><img src="/lamp-uit.svg" alt=""></div>
   <div class="lampnaam"><b>${esc(l.host)}</b><span class="sub">${t('laatstGezien',{t:esc(geleden(l.laatst))})}</span></div>
   <button class="knop grijs klein" data-vergeet="${id}">${t('vergeet')}</button></div>
  <div class="kaartvoet"><span class="zacht">${esc(l.board||'')}</span><a>${id}</a></div></article>`;
 const kan=l.toegang,aan=kan&&vink.has(l.ip),brandt=!!(live[l.ip]?live[l.ip].niveau:l.lampNiveau);
 const tunes=(l.deuntjes||[]).map(d=>`<option value="${esc(d.id)}" ${d.id===l.deuntje?'selected':''}>${esc(d.naam)}</option>`).join('');
 const seg=['auto','aan','uit'].map(k=>`<button data-stand="${k}" data-ip="${id}" class="${(l.lampStand||'auto')===k?'actief':''}" ${kan?'':'disabled'}>${t({auto:'auto',aan:'altijdAan',uit:'altijdUit'}[k])}</button>`).join('');
 return `<article class="kaart lamp ${aan?'gekozen':''} ${brandt?'brandt':''}" data-ip="${id}">
  <div class="lampbalk"><label class="vinkje"><input type="checkbox" data-kies="${id}" ${aan?'checked':''} ${kan?'':'disabled'} aria-label="${esc(l.host)}"><i></i></label>
   <div class="knopjes">
    <button class="ikoon klein" data-welke="${id}" title="${t('welke')}" aria-label="${t('welke')}" ${kan?'':'disabled'}>${IK.welke}</button>
    <button class="ikoon klein" data-hernoem="${id}" title="${t('hernoem')}" aria-label="${t('hernoem')}" ${kan?'':'disabled'}>${IK.hernoem}</button>
    <button class="ikoon klein" data-open="${id}" title="${t('instellingenVan')}" aria-label="${t('instellingenVan')}" ${kan?'':'disabled'}>${IK.tandwiel}</button></div></div>
  <button class="lampknop ${brandt?'aan':''}" data-schakel="${id}" title="${t('tikLamp')}" aria-label="${t('tikLamp')}" ${kan?'':'disabled'}>${lampImg()}</button>
  <div class="lampnaam"><b>${esc(l.host)}</b>${l.naam?`<span class="sub">${esc(l.naam)}</span>`:''}</div>
  ${kan?`<div class="seg">${seg}</div>
   <div class="cijfers"><div><b>${nf(l.zaps)}</b><span>${t('zaps')}</span></div><div><b>${nf(l.sats)}</b><span>${t('sats')}</span></div><div><b>${duur(l.uptime)}</b><span>${t('aanSinds')}</span></div></div>
   <div class="chips">${versieChip(l)}${staatChips(l)}</div>
   ${tuneBlok(l,id,tunes)}`
  :`<div class="fout">${l.fout==='wrong password'?t('fouteWw'):l.fout==='password needed'?t('wwNodigUit'):esc(l.fout||t('geenToegang'))}</div>`}
  <div class="kaartvoet"><details class="ww" data-ip="${id}" ${open.has(l.ip)||!kan?'open':''}><summary>${!kan?t('wwNodig'):l.eigenWachtwoord?t('wwEigen'):t('wwStandaard')}</summary>
   <input type="password" data-ww="${id}" value="${esc(ww[l.ip]||'')}" placeholder="${t('wwPh')}" autocomplete="off"></details>
   <a href="http://${id}/${/^[0-9a-f]{32}$/.test(l.sessie||'')?'#sessie='+l.sessie:''}" target="_blank" rel="noopener">${id}</a></div>
 </article>`}
function tekenLampen(){
 const vink=new Set(gekozen()),open=new Set([...document.querySelectorAll('details.ww[open]')].map(d=>d.dataset.ip)),ww={};
 document.querySelectorAll('[data-ww]').forEach(x=>{if(x.value)ww[x.dataset.ww]=x.value});
 if(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.ww!==undefined)return; // typing a password
 const aanw=lampen.filter(l=>l.online),weg=lampen.filter(l=>!l.online);
 $('lampen').innerHTML=aanw.length?aanw.map(l=>kaart(l,vink,ww,open)).join(''):`<div class="kaart leeg">${t(lampen.length?'allesOffline':'geenZappers')}</div>`;
 $('offline').innerHTML=weg.map(l=>kaart(l,vink,ww,open)).join('');$('offKop').classList.toggle('verborgen',!weg.length);
 tel()}
function tekenHeld(){
 const on=lampen.filter(l=>l.online),aan=on.filter(l=>live[l.ip]?live[l.ip].niveau:l.lampNiveau).length;
 $('heldlamp').classList.toggle('brandt',aan>0);
 $('heldTitel').textContent=!lampen.length?t('heldGeen'):!aan?t('heldUit'):on.length===1?t('heldEen'):aan===on.length?t('heldAlles',{n:on.length}):t('heldDeel',{a:aan,n:on.length})}
function tel(){const n=gekozen().length,m=lampen.filter(l=>l.toegang).length;
 $('teller').textContent=n?t('gekozen',{n,m}):t('geenGekozen');$('alles').checked=n>0&&n===m;
 $('zwTekst').textContent=t('zwGekozen',{n});$('zwevend').classList.toggle('zichtbaar',n>0&&!zichtbaar($('acties')));
 document.querySelectorAll('.lamp').forEach(k=>{const c=k.querySelector('[data-kies]');k.classList.toggle('gekozen',!!(c&&c.checked))})}
function toon(d){
 laatste=d;geladen=true;lampen=d.lampen||[];versie=d.versie||'';
 const on=lampen.filter(l=>l.online),achter=lampen.filter(loopAchter).length,off=lampen.length-on.length;
 $('tOnline').textContent=lampen.length?`${on.length}/${lampen.length}`:'0';
 $('tZaps').textContent=nf(on.reduce((s,l)=>s+(l.zaps||0),0));$('tSats').textContent=nf(on.reduce((s,l)=>s+(l.sats||0),0));
 $('tUpdate').textContent=achter;
 tekenHeld();
 $('status').innerHTML=`<span class="stip ${on.length?'ok':'warn'}">${t(on.length==1?'statusN':'statusNs',{n:on.length})}</span>`+
  (versie?`<span class="stip ok">${t(d.map==='online'?'firmwareOnline':'images',{v:esc(versie)})}</span>`:`<span class="stip warn">${t(d.onlineFout?'kanaalWeg':'geenImages')}</span>`)+
  (achter?`<span class="stip warn">${t('achter',{n:achter})}</span>`:'')+(off?`<span class="stip err">${t('offlineN',{n:off})}</span>`:'');
 const c=d.control||{};$('controlLet').classList.toggle('verborgen',!(c.nieuw&&c.kan));
 if(c.nieuw)$('controlTekst').textContent=t('controlNieuw',{n:c.nieuw,h:c.huidig});
 const oud=d.bron&&(!versie||vergelijk(d.bron,versie)>0);$('bouwlet').classList.toggle('verborgen',!oud);
 if(oud)$('bouwtekst').textContent=versie?t('bronNieuwer',{b:d.bron,v:versie}):t('bronGeenImages',{b:d.bron});
 const bz=$('bZapDeuntje').value,lijstT=(lampen.find(l=>l.toegang&&l.deuntjes&&l.deuntjes.length)||{}).deuntjes||[];
 $('bZapDeuntje').innerHTML=`<option value="__">${t('laat')}</option><option value="">${t('zapPiep')}</option>`+lijstT.map(x=>`<option value="${esc(x.id)}">${esc(x.naam)}</option>`).join('');
 $('bZapDeuntje').value=[...$('bZapDeuntje').options].some(o=>o.value===bz)?bz:'__';
 const b=$('bron').value;$('bron').innerHTML=lampen.filter(l=>l.toegang).map(l=>`<option value="${esc(l.ip)}">${esc(l.host)}</option>`).join('');if(b)$('bron').value=b;
 tekenLampen()}
async function zoek(){$('zoek').classList.add('draait');try{toon(await(await fetch('/zoek')).json())}finally{$('zoek').classList.remove('draait')}}
$('zoek').onclick=zoek;
$('alles').onchange=e=>{document.querySelectorAll('[data-kies]:not(:disabled)').forEach(c=>c.checked=e.target.checked);tel()};
$('tabs').onclick=e=>{const k=e.target.dataset.tab;if(!k)return;
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('actief',b===e.target));
 document.querySelectorAll('.paneel').forEach(p=>p.classList.toggle('actief',p.dataset.paneel===k))};
$('lampen').addEventListener('change',async e=>{const x=e.target;if(x.dataset.kies){tel();return}
 try{if(x.dataset.tune){toon(await post('/deuntje',{ip:x.dataset.tune,veld:x.dataset.veld||'deuntje',deuntje:x.value}));meld(t('opgeslagen'));return}
  if(x.dataset.ww!==undefined){x.blur();toon(await post('/wachtwoord',{ip:x.dataset.ww,wachtwoord:x.value}))}}catch(f){alert(f.message)}});
async function zetStand(ip,stand){
 const l=lampen.find(x=>x.ip===ip);if(!l)return;
 try{const d=await post('/een',{ip,soort:'stand',stand});l.lampStand=stand;Object.assign(live,d.standen||{});tekenLampen();tekenHeld();
  meld(l.host+': '+t({auto:'auto',aan:'altijdAan',uit:'altijdUit'}[stand]))}catch(f){alert(f.message)}}
$('lampen').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.schakel){const ip=b.dataset.schakel,s=live[ip],brandt=s?s.niveau>0:!!(lampen.find(x=>x.ip===ip)||{}).lampNiveau;
  zetStand(ip,brandt?'uit':'aan');return}
 if(b.dataset.stand){zetStand(b.dataset.ip,b.dataset.stand);return}
 const ip=b.dataset.hernoem||b.dataset.welke||b.dataset.speel||b.dataset.open||b.dataset.vergeet;const l=lampen.find(x=>x.ip===ip);if(!l)return;
 try{
  if(b.dataset.vergeet){toon(await post('/vergeet',{ip}));return}
  if(b.dataset.open){openPaneel(ip);return}
  if(b.dataset.welke){await post('/een',{ip,soort:'identificeer'});return}
  if(b.dataset.speel){const s=document.querySelector(`[data-tune="${CSS.escape(ip)}"][data-veld="${b.dataset.veld||'deuntje'}"]`),v=s?s.value:'';
   await post('/een',(b.dataset.veld==='zapDeuntje'&&!v)?{ip,soort:'testzap'}:{ip,soort:'speel',deuntje:v});return}
  if(b.dataset.hernoem){const n=prompt(t('nieuweNaam',{h:l.host}),l.host);if(n&&n!==l.host)toon(await post('/hernoem',{ip,host:n}))}
 }catch(f){alert(f.message)}});

function waarden(paneel){const w={};
 document.querySelectorAll(`[data-paneel="${paneel}"] [data-v]`).forEach(x=>{const v=x.value.trim();
  if(x.dataset.v==='zapDeuntje'){if(v!=='__')w.zapDeuntje=v;return}
  if(v==='')return;
  w[x.dataset.v]=('num' in x.dataset)?Number(v):('bool' in x.dataset)?v==='1':v});return w}
document.querySelectorAll('[data-doe]').forEach(b=>b.onclick=async()=>{
 let soort=b.dataset.doe;const ips=gekozen(),obj={soort,ips};
 if(soort!=='bouw'&&!ips.length){alert(t('kiesEerst'));return}
 const z=lampen.filter(l=>ips.includes(l.ip)).map(l=>l.host).join(', ');
 if(soort==='update'){if(!versie){alert(t('eerstBouwen'));return}if(!confirm(t('vraagUpdate',{z,v:versie})))return}
 if(soort==='herstart'&&!confirm(t('vraagHerstart',{z})))return;
 if(soort==='reset'&&!confirm(t('vraagReset',{z})))return;
 if(soort==='publiceer'&&!confirm(t('vraagPub',{z})))return;
 if(soort==='stand')obj.stand=$('stand').value;
 if(soort==='nabootsen')obj.sats=$('nepSats').value;
 if(soort==='instellingen'||soort==='feestinstellingen'){obj.soort='instellingen';obj.waarden=waarden(soort==='feestinstellingen'?'feest':'instellingen');
  obj.publiceer=soort==='instellingen'&&$('publiceer').checked;
  if(!Object.keys(obj.waarden).length&&!obj.publiceer){alert(t('vulIets'));return}
  if(!confirm(t('vraagInst',{w:Object.keys(obj.waarden).join(', ')+(obj.publiceer?t('vraagPubliceer'):''),z})))return}
 if(soort==='kopie'){obj.bron=$('bron').value;const bron=lampen.find(l=>l.ip===obj.bron);if(!confirm(t('vraagKopie',{b:bron?bron.host:'?',z})))return}
 if(soort==='verdeel'&&!confirm(t('vraagVerdeel',{z})))return;
 if(soort==='wifi'){obj.ssid=$('ssid').value.trim();obj.wachtwoord=$('wpass').value;if(!obj.ssid){alert(t('vulNetwerk'));return}
  if(!confirm(t('vraagWifi',{z,s:obj.ssid})))return}
 try{await post('/actie',obj);volg()}catch(f){alert(f.message)}});
function logRegel(s){const r=esc(s);
 if(/FAILED|no access/i.test(s))return `<span class="slecht">${r}</span>`;
 if(/^\d\d:\d\d:\d\d (Done|.*: (OK|now runs|back online|self-test \d+\/\d+$))/.test(s))return `<span class="goed">${r}</span>`;
 if(/^\d\d:\d\d:\d\d [A-Z][^:]*: \d+ Zappers?$/.test(s))return `<span class="kop">${r}</span>`;return r}
let volgTimer;
async function volg(alleenTekst){
 const d=await(await fetch('/voortgang')).json();bezig=d.bezig;
 document.querySelectorAll('[data-doe]').forEach(b=>b.disabled=bezig);$('bezig').textContent=bezig?t('bezig'):'';
 $('log').innerHTML=d.regels.length?d.regels.map(logRegel).join('\n'):`<span class="zacht">${t('nogNiets')}</span>`;$('log').scrollTop=1e9;
 if(alleenTekst)return;clearTimeout(volgTimer);
 if(bezig){volgTimer=setTimeout(volg,1000);return}
 if(d.regels.length)toon(await(await fetch('/lijst')).json())}
async function netten(){try{const d=await(await fetch('/netten')).json();$('netten').innerHTML=d.map(n=>`<option value="${esc(n)}">`).join('')}catch(e){}}

// ---- the settings panel of one Zapper
let paneelIp=null,paneelData=null,paneelOrigineel={};
function lees(el){const v=el.value;return ('bool' in el.dataset)?v==='1':(el.type==='number'||'num' in el.dataset)?(v===''?null:Number(v)):v}
function vulPaneel(d){
 paneelData=d;const v=d.velden||{};
 $('pNaam').textContent=d.host;$('pSub').textContent=[d.board,(d.versie||'').split(' ')[0],paneelIp].filter(Boolean).join(' · ');
 const brandt=d.lampStand!=='uit';$('pLamp').classList.toggle('brandt',brandt);$('pLampImg').src='/lamp-'+(brandt?'aan':'uit')+'.svg';
 $('pStand').value=d.lampStand||'auto';
 const opties=(d.deuntjes||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.naam)} (${(x.ms/1000).toFixed(1)} s)</option>`).join('');
 $('pDeuntje').innerHTML=opties;$('pZapDeuntje').innerHTML=`<option value="">${t('zapPiep')}</option>`+opties;
 document.querySelectorAll('[data-p]').forEach(el=>{const k=el.dataset.p,w=v[k];if(w===undefined)return;
  el.value=('bool' in el.dataset)?(w?'1':'0'):(w??'')});
 document.querySelectorAll('.pBuzzer').forEach(e=>e.classList.toggle('verborgen',!d.buzzer));
 paneelOrigineel={};document.querySelectorAll('[data-p]').forEach(el=>paneelOrigineel[el.dataset.p]=lees(el));paneelOrigineel.__stand=$('pStand').value;
 const m=d.mijlpaal||{};
 $('pStapBalk').style.width=(m.aan&&m.stap?Math.round(100*(m.stap-m.nog)/m.stap):0)+'%';
 $('pStapVak').classList.toggle('verborgen',!m.aan);
 $('pStapTekst').textContent=m.aan?t('nogTotStap',{n:nf(m.nog),s:nf(m.stap),k:nf(m.keer)}):'';
 const g=d.doel||{},pct=g.sats?Math.min(100,Math.floor(100*g.opgehaald/g.sats)):0;
 $('pDoelBalk').style.width=(g.aan?pct:0)+'%';
 $('pDoelVak').classList.toggle('verborgen',!g.aan);
 $('pDoelTekst').textContent=!g.aan?'':g.gehaald?t('doelGehaald',{o:nf(g.opgehaald)}):t('doelStand',{o:nf(g.opgehaald),d:nf(g.sats),p:pct});
 const rij=(k,w)=>w==null||w===''?'':`<dt>${t(k)}</dt><dd>${esc(w)}</dd>`;
 $('pGegevens').innerHTML=rij('versie',d.versie)+rij('board',d.board)+rij('mac',d.mac)+rij('aanSinds',duur(d.uptime))+
  rij('herstartReden',d.herstartReden)+rij('temp',d.tempC!=null?Number(d.tempC).toFixed(1)+' °C':null)+rij('wifiGem',d.rssiGem!=null?d.rssiGem+' dBm':null)+
  rij('zaps',nf(d.zaps))+rij('sats',nf(d.sats))+rij('grootste',d.grootste!=null?nf(d.grootste)+' sats':null)+(d.npub?`<dt>npub</dt><dd>${esc(d.npub)}</dd>`:'');
 $('pLog').innerHTML=(d.log||[]).map(r=>`<div><span class="t">${r.tijd?new Date(r.tijd*1000).toLocaleTimeString(taal==='nl'?'nl-NL':'en-GB',{hour:'2-digit',minute:'2-digit'}):'+'+r.sinds+'s'}</span><span class="s">${esc(r.soort)}</span><span>${esc(r.tekst)}</span></div>`).join('')||`<span class="zacht">-</span>`;
 $('pOpen').href='http://'+paneelIp+'/';$('pVoet').textContent='';
}
async function openPaneel(ip){
 paneelIp=ip;paneelData=null;$('pNaam').textContent=(lampen.find(l=>l.ip===ip)||{}).host||ip;$('pSub').textContent=t('laden');
 $('paneel').showModal();$('pInhoud').scrollTop=0;
 try{vulPaneel(await(await fetch('/lamp?ip='+encodeURIComponent(ip))).json())}catch(f){$('pVoet').textContent=f.message}}
$('pSluit').onclick=()=>$('paneel').close();
$('paneel').addEventListener('close',()=>{paneelIp=null;fetch('/lijst').then(r=>r.json()).then(toon)});
$('paneel').addEventListener('click',e=>{if(e.target===$('paneel'))$('paneel').close()});
$('pBewaar').onclick=async()=>{
 const w={};document.querySelectorAll('[data-p]').forEach(el=>{const v=lees(el);if(v!==null&&v!==paneelOrigineel[el.dataset.p])w[el.dataset.p]=v});
 const stand=$('pStand').value!==paneelOrigineel.__stand?$('pStand').value:null;
 if(!Object.keys(w).length&&!stand){meld(t('nietsVeranderd'));return}
 $('pBewaar').disabled=true;
 try{vulPaneel(await post('/bewaar',{ip:paneelIp,waarden:w,stand}));meld(t('opgeslagen'));volg(true)}catch(f){alert(f.message)}finally{$('pBewaar').disabled=false}};
$('pZapSpeel').onclick=()=>{const v=$('pZapDeuntje').value;
 post('/een',v?{ip:paneelIp,soort:'speel',deuntje:v}:{ip:paneelIp,soort:'testzap'}).catch(f=>alert(f.message))};
$('pSpeel').onclick=()=>post('/een',{ip:paneelIp,soort:'speel',deuntje:$('pDeuntje').value}).catch(f=>alert(f.message));
$('pStil').onclick=()=>post('/een',{ip:paneelIp,soort:'stil'}).catch(f=>alert(f.message));
$('pMeldTest').onclick=async()=>{try{await post('/een',{ip:paneelIp,soort:'meldtest'});meld(t('verstuurd'))}catch(f){alert(f.message)}};
$('pStapNul').onclick=async()=>{if(!confirm(t('vraagStapNul')))return;try{vulPaneel(await post('/een',{ip:paneelIp,soort:'stapopnieuw'}))}catch(f){alert(f.message)}};
$('pDoelNul').onclick=async()=>{if(!confirm(t('vraagDoelNul')))return;try{vulPaneel(await post('/een',{ip:paneelIp,soort:'doelopnieuw'}))}catch(f){alert(f.message)}};
document.querySelectorAll('[data-een]').forEach(b=>b.onclick=async()=>{
 const soort=b.dataset.een,h=paneelData?paneelData.host:'';
 if(soort==='herstart'&&!confirm(t('vraagHerstart',{z:h})))return;
 if(soort==='reset'&&!confirm(t('vraagReset',{z:h})))return;
 if(soort==='publiceer'&&!confirm(t('vraagPub',{z:h})))return;
 b.disabled=true;
 try{const d=await post('/een',{ip:paneelIp,soort,sats:$('pNepSats').value});meld(d.tekst||t('opgeslagen'));volg(true);
  if(['reset','nabootsen'].includes(soort)&&paneelIp)vulPaneel(await(await fetch('/lamp?ip='+encodeURIComponent(paneelIp))).json())}
 catch(f){alert(f.message)}finally{b.disabled=false}});

// ---- Zapper control updates itself: replace, restart, and reload this page
$('controlKnop').onclick=async()=>{
 const voor=await(await fetch('/wie')).json().catch(()=>({}));
 try{await post('/zelfupdate',{})}catch(f){alert(f.message);return}
 $('controlTekst').textContent=t('controlBezig');$('controlKnop').disabled=true;
 const kijk=async()=>{try{const w=await(await fetch('/wie')).json();if(w.bouw!==voor.bouw){location.reload();return}}catch(e){}setTimeout(kijk,1000)};
 setTimeout(kijk,1500)};

// ---- live: every lamp on the page follows the real one, blinking along on a zap
const zichtbaar=el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0};
async function haalStanden(){if(document.hidden)return;
 try{const d=await(await fetch('/standen')).json();
  const nu=Date.now();for(const ip in d){const o=live[ip],n=d[ip];
   // a new or longer blink: remember when it started, so the page keeps the tempo
   n.tot=n.knippert?nu+n.knippert:0;n.start=(o&&o.tot>nu&&n.knippert)?o.start:nu;live[ip]=n}
  tekenHeld()}catch(e){}}
function tekenLive(){const nu=Date.now();
 document.querySelectorAll('.lamp[data-ip]').forEach(k=>{const s=live[k.dataset.ip];if(!s)return;
  const knipper=s.tot>nu,knop=k.querySelector('.lampknop');
  const aan=knipper?Math.floor((nu-s.start)/Math.max(60,s.periode/2))%2===0:s.niveau>0;
  if(knop)knop.classList.toggle('aan',aan);k.classList.toggle('brandt',knipper?true:s.niveau>0);k.classList.toggle('zapt',knipper);
  let badge=k.querySelector('.zapbadge');
  if(knipper&&!badge){badge=document.createElement('span');badge.className='zapbadge';badge.textContent='⚡ '+t('zapNu');k.appendChild(badge)}
  if(!knipper&&badge)badge.remove()});
 requestAnimationFrame(tekenLive)}
setInterval(haalStanden,1500);requestAnimationFrame(tekenLive);
$('zwKnop').onclick=()=>$('acties').scrollIntoView({behavior:'smooth',block:'start'});
addEventListener('scroll',()=>{const n=gekozen().length;$('zwevend').classList.toggle('zichtbaar',n>0&&!zichtbaar($('acties')))},{passive:true});

// keep the cards fresh while the page is open, but not while a job runs or a panel is open
setInterval(async()=>{if(bezig||paneelIp||document.hidden)return;try{toon(await(await fetch('/ververs')).json())}catch(e){}},20000);
setInterval(()=>fetch('/leef').catch(()=>{}),15000);
pasTaalToe();zoek().then(()=>{const m=location.hash.match(/^#zapper=(.+)$/);if(m&&lampen.some(l=>l.ip===m[1]&&l.toegang))openPaneel(m[1]);netten()});volg();
</script></body></html>
"""


def maak_handler(staat):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _stuur(self, data, soort, code=200):
            self.send_response(code)
            self.send_header("Content-Type", soort)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _json(self, obj, code=200):
            self._stuur(json.dumps(obj).encode(), "application/json", code)

        def _overzicht(self):
            online = staat.get("online") or {}
            doel = versie_doel(staat)
            herkomst = ("online" if online.get("versie") == doel and doel else
                        (os.path.relpath(staat["map"], WORTEL) if staat["map"] else None))
            return {"lampen": lijst(staat), "versie": doel, "bron": bron_versie() if IN_REPO else None,
                    "map": herkomst, "onlineFout": staat.get("online_fout", ""),
                    "control": control_update(staat)}

        def _eigen_host(self):
            # Only requests addressed to this computer itself. A website that points
            # its own name at 127.0.0.1 (DNS rebinding) sends its name as Host and is
            # refused, so it cannot read the list with the lamp sessions.
            host = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]").lower()
            if host in ("127.0.0.1", "localhost", "::1"):
                return True
            self.send_error(403)
            return False

        def do_GET(self):
            if not self._eigen_host():
                return
            staat["leef"] = time.time()
            pad, _, vraag = self.path.partition("?")
            q = urllib.parse.parse_qs(vraag)
            if pad == "/":
                self._stuur(PAGINA.replace("%TOKEN%", staat["token"]).encode(), "text/html; charset=utf-8")
            elif pad in ("/logo.svg", "/lamp-aan.svg", "/lamp-uit.svg"):
                bestand = LOGO if pad == "/logo.svg" else os.path.join(WORTEL, "assets", "lamp", pad[1:])
                try:
                    self._stuur(open(bestand, "rb").read(), "image/svg+xml")
                except OSError:
                    ingebed = INGEBED.get(pad[1:-4])
                    if ingebed:
                        self._stuur(ingebed.encode(), "image/svg+xml")
                    else:
                        self.send_error(404)
            elif pad == "/zoek":
                online_manifest(staat, vers=True)
                verzamel(staat, zoeken=True)
                self._json(self._overzicht())
            elif pad == "/ververs":
                # the regular refresh while the page is open: no network search, and
                # never while a job runs, so it does not talk to a lamp in between
                if not staat["klus"].bezig:
                    verzamel(staat, zoeken=False)
                self._json(self._overzicht())
            elif pad == "/lijst":
                self._json(self._overzicht())
            elif pad == "/standen":
                # the live state of every lamp, for the lamps on the page: public and cheap
                self._json(live_standen(staat))
            elif pad == "/lamp":
                lamp = staat["lampen"].get((q.get("ip") or [""])[0])
                if not lamp:
                    return self._json({"fout": "unknown Zapper"}, 404)
                try:
                    self._json(lamp.detail())
                except Exception as e:
                    self._json({"fout": str(e)}, 502)
            elif pad == "/voortgang":
                self._json({"regels": staat["klus"].regels, "bezig": staat["klus"].bezig})
            elif pad == "/netten":
                self._json(netten(staat))
            elif pad == "/leef":
                self._json({"ok": True})
            elif pad == "/wie":
                self._json({"app": "zapper-control", "bouw": staat["bouw"]})
            else:
                self.send_error(404)

        def do_POST(self):
            if not self._eigen_host():
                return
            if self.path == "/afsluiten":
                # A newer Zapper control asks this one to make room. The custom header
                # cannot come from a web page without a preflight we never answer.
                if self.headers.get("X-Zapper-Control") == "nieuwer":
                    self._json({"ok": True})
                    threading.Thread(target=staat["server"].shutdown, daemon=True).start()
                else:
                    self._json({"fout": "not allowed"}, 403)
                return
            # Only our own page knows the token, so another website cannot drive this tool.
            if self.headers.get("X-Token") != staat["token"]:
                return self._json({"fout": "not allowed"}, 403)
            staat["leef"] = time.time()
            try:
                d = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            except ValueError:
                return self._json({"fout": "invalid json"}, 400)
            lamp = staat["lampen"].get(d.get("ip"))
            if self.path == "/actie":
                return self._actie(d)
            if self.path == "/zelfupdate":
                c = control_update(staat)
                if not c["nieuw"] or not c["kan"]:
                    return self._json({"fout": "no newer Zapper control to install here"}, 400)
                try:
                    werk_zelf(staat)
                except Exception as e:
                    return self._json({"fout": str(e)}, 502)
                return self._json({"ok": True, "versie": c["nieuw"]})
            if self.path == "/vergeet":
                if lamp and not lamp.info.get("online"):
                    del staat["lampen"][lamp.ip]
                    bewaar_bekend(staat)
                return self._json(self._overzicht())
            if not lamp:
                return self._json({"fout": "unknown Zapper"}, 404)
            try:
                if self.path == "/wachtwoord":
                    ww = d.get("wachtwoord") or None
                    lamp.bekijk(ww)
                    # Most people use one password for all their lamps: try it on the others too.
                    if ww and lamp.info.get("toegang"):
                        for ander in list(staat["lampen"].values()):
                            if ander is not lamp and ander.info.get("online") and not ander.info.get("toegang"):
                                vorig = ander.wachtwoord
                                ander.bekijk(ww)
                                if not ander.info.get("toegang"):
                                    ander.wachtwoord = vorig
                    return self._json(self._overzicht())
                if self.path == "/hernoem":
                    # the same rules as the lamp: spaces and underscores become a hyphen
                    nieuw = re.sub(r"[ _-]+", "-", str(d.get("host", "")).lower().strip())
                    nieuw = re.sub(r"[^a-z0-9-]", "", nieuw).strip("-")
                    if not nieuw:
                        return self._json({"fout": "use letters, digits and hyphens"}, 400)
                    if any(l.info["host"] == nieuw and l is not lamp for l in staat["lampen"].values()):
                        return self._json({"fout": f"{nieuw} is already taken by another Zapper"}, 409)
                    lamp.post("/api/settings", {"host": nieuw})
                    lamp.bekijk()
                    staat["klus"].meld(f"{nieuw}: renamed, now http://{nieuw}.local")
                    bewaar_bekend(staat)
                    return self._json(self._overzicht())
                if self.path == "/deuntje":
                    # the celebration tune, or (veld zapDeuntje) the sound on a zap; "" is the beep
                    veld = "zapDeuntje" if d.get("veld") == "zapDeuntje" else "deuntje"
                    keuze = str(d.get("deuntje", ""))
                    ids = {t["id"] for t in lamp.info.get("deuntjes") or []}
                    if keuze not in ids and not (veld == "zapDeuntje" and keuze == ""):
                        return self._json({"fout": "unknown tune"}, 400)
                    lamp.post("/api/settings", {veld: keuze})
                    lamp.info[veld] = keuze
                    naam = next((t["naam"] for t in lamp.info["deuntjes"] if t["id"] == keuze), "short beep")
                    wat = "zap sound" if veld == "zapDeuntje" else "celebration tune"
                    staat["klus"].meld(f"{lamp.info['host']}: {wat} set to {naam}")
                    return self._json(self._overzicht())
                if self.path == "/bewaar":
                    # the settings panel of one lamp: only what changed is sent
                    waarden = schone_waarden(d.get("waarden"))
                    if waarden:
                        lamp.post("/api/settings", waarden)
                    stand = d.get("stand")
                    if stand in ("auto", "aan", "uit"):
                        lamp.post(f"/api/lamp?doe={stand}")
                    lamp.bekijk()
                    staat["klus"].meld(f"{lamp.info['host']}: saved " + (", ".join(sorted(waarden)) or "lamp mode"))
                    return self._json(lamp.detail())
                if self.path == "/een":
                    # one quick thing on one lamp, straight from its card or panel
                    soort = d.get("soort")
                    if soort == "speel":
                        lamp.post("/api/lamp?doe=feest&deuntje=" + urllib.parse.quote(str(d.get("deuntje", ""))))
                        return self._json({"ok": True})
                    if soort == "stil":
                        lamp.post("/api/lamp?doe=stil")
                        return self._json({"ok": True})
                    if soort == "meldtest":
                        lamp.post("/api/meldtest")
                        return self._json({"ok": True})
                    if soort == "doelopnieuw":
                        lamp.post("/api/doelopnieuw")
                        return self._json(lamp.detail())
                    if soort == "stapopnieuw":
                        lamp.post("/api/stapopnieuw")
                        return self._json(lamp.detail())
                    if soort == "stand":
                        stand = d.get("stand")
                        if stand not in ("auto", "aan", "uit"):
                            return self._json({"fout": "unknown lamp mode"}, 400)
                        lamp.post(f"/api/lamp?doe={stand}")
                        lamp.info["lampStand"] = stand
                        return self._json({"ok": True, "standen": live_standen(staat, [lamp])})
                    if soort in ("identificeer", "testzap", "herstart", "zelftest", "reset", "publiceer", "nabootsen"):
                        extra = d.get("sats")
                        if soort == "nabootsen" and not (str(extra).isdigit() and 0 < int(extra) <= 100000000):
                            return self._json({"fout": "sats: 1 to 100000000"}, 400)
                        uit = werk_eenvoudig(soort, extra)(lamp)
                        staat["klus"].meld(f"{lamp.info['host']}: {uit}")
                        return self._json({"ok": True, "tekst": uit})
                    return self._json({"fout": "unknown action"}, 400)
            except Exception as e:
                return self._json({"fout": str(e)}, 502)
            self.send_error(404)

        def _actie(self, d):
            if staat["klus"].bezig:
                return self._json({"fout": "still busy with the previous job"}, 409)
            soort = d.get("soort")
            klus = staat["klus"] = Klus()
            if soort == "bouw":
                threading.Thread(target=bouw_images, args=(klus, staat), daemon=True).start()
                return self._json({"ok": True})
            lampen = [staat["lampen"][ip] for ip in d.get("ips", []) if ip in staat["lampen"]]
            lampen = [l for l in lampen if l.info.get("toegang")]
            if not lampen:
                return self._json({"fout": "no reachable Zapper selected"}, 400)
            if soort == "update":
                if not versie_doel(staat):
                    return self._json({"fout": "no firmware found: not online, and no images built"}, 400)
                titel, werk = f"Update to {versie_doel(staat)}", werk_update(staat)
            elif soort == "wifi":
                ssid = str(d.get("ssid", "")).strip()
                if not ssid:
                    return self._json({"fout": "no network"}, 400)
                titel, werk = f"Move to Wi-Fi '{ssid}'", werk_wifi(ssid, str(d.get("wachtwoord", "")))
            elif soort == "instellingen":
                titel, werk = "Settings", werk_instellingen(schone_waarden(d.get("waarden")), bool(d.get("publiceer")))
            elif soort == "kopie":
                bron = staat["lampen"].get(d.get("bron"))
                if not bron or not bron.info.get("toegang"):
                    return self._json({"fout": "choose the Zapper to copy from"}, 400)
                try:
                    titel, werk = f"Copy settings of {bron.info['host']}", werk_kopie(bron)
                except Exception as e:
                    return self._json({"fout": f"could not read {bron.info['host']}: {e}"}, 502)
            elif soort == "backup":
                map_ = os.path.join(BACKUPS, time.strftime("%Y-%m-%d_%H%M"))
                os.makedirs(map_, exist_ok=True)
                titel, werk = f"Backup to {map_}", werk_backup(map_)
            elif soort == "verdeel":
                titel, werk = "Give each a different tune", werk_verdeel(staat, lampen)
            elif soort == "speelrij":
                titel, werk = "Play their tunes in turn", werk_speel_na_elkaar()
            elif soort in ("herstart", "identificeer", "testzap", "zelftest", "stand", "nabootsen", "reset", "publiceer"):
                extra = d.get("stand") if soort == "stand" else d.get("sats")
                if soort == "stand" and extra not in ("auto", "aan", "uit"):
                    return self._json({"fout": "unknown lamp mode"}, 400)
                if soort == "nabootsen" and not (str(extra).isdigit() and 0 < int(extra) <= 100000000):
                    return self._json({"fout": "sats: 1 to 100000000"}, 400)
                titels = {"herstart": "Restart", "identificeer": "Which one is this", "testzap": "Test zap",
                          "zelftest": "Self-test", "stand": "Lamp mode", "nabootsen": "Simulated zap",
                          "reset": "Counters to 0", "publiceer": "Publish profile"}
                titel, werk = titels[soort], werk_eenvoudig(soort, extra)
            else:
                return self._json({"fout": "unknown action"}, 400)
            threading.Thread(target=klus.per_lamp, args=(lampen, titel, werk), daemon=True).start()
            return self._json({"ok": True})
    return Handler


# ---------------------------------------------------------------- start

def maak_plaats(poort, eigen_bouw):
    """True when an older Zapper control on this port has stopped for us."""
    basis = f"http://127.0.0.1:{poort}"
    try:
        wie = json.loads(urllib.request.urlopen(basis + "/wie", timeout=2).read())
        if wie.get("app") == "zapper-control" and wie.get("bouw", 0) >= eigen_bouw:
            return False
    except urllib.error.HTTPError:
        pass  # no /wie yet: an older version
    except (OSError, ValueError):
        return False
    try:
        verzoek = urllib.request.Request(basis + "/afsluiten", data=b"", method="POST",
                                         headers={"X-Zapper-Control": "nieuwer"})
        urllib.request.urlopen(verzoek, timeout=2)
        return True
    except (OSError, ValueError):
        return False


def main():
    p = argparse.ArgumentParser(description="Zapper control: manage the Zappers on your network.")
    p.add_argument("--map", help="folder with the images (default: newest dist/zapper-*)")
    p.add_argument("--poort", type=int, default=8770, help="port of the page on 127.0.0.1")
    p.add_argument("--lijst", action="store_true", help="only list the Zappers found")
    p.add_argument("--alle", action="store_true", help="update every Zapper that is behind, without the page")
    p.add_argument("--ja", action="store_true", help="with --alle: do not ask for confirmation")
    p.add_argument("--wachtwoord", help="password for --lijst and --alle (default: ZAPPER_WACHTWOORD, else Bitcoin21)")
    a = p.parse_args()

    staat = {"map": os.path.abspath(a.map) if a.map else nieuwste_map(), "lampen": {}, "klus": Klus(),
             "leef": time.time(), "token": os.urandom(16).hex(), "slot": threading.Lock(),
             "bouw": int(os.path.getmtime(os.path.abspath(__file__)))}
    for ip, info in lees_bekend().items():
        staat["lampen"][ip] = Lamp({"ip": ip, **info})
    online_manifest(staat, vers=True)
    versie = versie_doel(staat)

    if a.lijst or a.alle:
        for info in zoek_mdns().values():
            if info["ip"] not in staat["lampen"]:
                staat["lampen"][info["ip"]] = Lamp(info)
        wachtwoord = a.wachtwoord or os.environ.get("ZAPPER_WACHTWOORD") or STANDAARD_WACHTWOORD
        for l in staat["lampen"].values():
            l.wachtwoord = wachtwoord
        verzamel(staat, zoeken=False)
        print(f"firmware: {versie or 'none'} ({'online' if (staat.get('online') or {}).get('versie') == versie else staat['map'] or '-'})")
        for i in lijst(staat):
            stand = ("up to date" if is_actueel(i, versie) else "") if i["toegang"] else i["fout"]
            print(f"  {i['host']:<16} {i['ip']:<16} {i.get('board') or '?':<24} {i.get('versie') or '?':<26} {stand}")
        if a.lijst:
            return
        todo = [l for l in staat["lampen"].values()
                if l.info["toegang"] and image_beschikbaar(staat, l.info["board"]) and not is_actueel(l.info, versie)]
        if not todo:
            print("nothing to update.")
            return
        if not a.ja and input(f"update {len(todo)} Zapper(s) to {versie}? [y/N] ").strip().lower() not in ("y", "j", "ja", "yes"):
            return
        staat["klus"].per_lamp(todo, f"Update to {versie}", werk_update(staat))
        return

    url = f"http://127.0.0.1:{a.poort}/"
    server = None
    for poging in range(2):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", a.poort), maak_handler(staat))
            break
        except OSError:
            # Something already listens there. The same or a newer Zapper control:
            # just show its page. An older one (or the old zapper-beheer): ask it
            # to make room, so a desktop start always gives the newest page.
            if poging == 0 and maak_plaats(a.poort, staat["bouw"]):
                time.sleep(1)
                continue
            print(f"already running, opening {url}")
            webbrowser.open(url)
            return
    staat["server"] = server

    def wachter():
        while True:
            time.sleep(10)
            if not staat["klus"].bezig and time.time() - staat["leef"] > STIL_NA:
                print("page closed, stopping.")
                server.shutdown()
                return
    threading.Thread(target=wachter, daemon=True).start()

    print(f"open {url}  (Ctrl+C to stop; it also stops a while after the page is closed)")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
