<!--
HA-Dashboard
Copyright (c) 2024-2026 Magnus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Alternatively, this software may be used under the terms of a
commercial license. See LICENSE_COMMERCIAL for details.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <div class="container">
    <p></p>
    <p class="h3">About - HA-Dashboard</p>
    <hr />

    <p class="fw-normal">
      HA-Dashboard is a customizable Home Assistant dashboard built with Vue 3. It provides a
      visual editor for creating and managing entity cards with a responsive, mobile-friendly design.
    </p>

    <p class="h4">Dual License</p>

    <p class="fw-normal">
      This software is available under a dual licensing model:
    </p>

    <div class="alert alert-info">
      <h5>GPL v3 License (Open Source)</h5>
      <p class="mb-0">
        Free to use, modify, and distribute for non-commercial purposes. If you distribute this
        software, you must also distribute your modifications under the same GPL v3 license.
      </p>
      <p class="small text-muted mt-2 mb-0">
        See <code>LICENSE</code> file for full terms.
      </p>
    </div>

    <div class="alert alert-info">
      <h5>Commercial License</h5>
      <p class="mb-0">
        If you wish to use this software in a commercial product, package it as an application, or
        deploy it without releasing your source code, you must obtain a commercial license.
      </p>
      <p class="small text-muted mt-2 mb-0">
        See <code>LICENSE_COMMERCIAL</code> file for terms and contact information.
      </p>
    </div>

    <p class="h4 mt-4">Attribution</p>

    <p class="fw-normal">
      Portions copyright (c) Magnus — <a href="https://github.com/mp-se/ha-dashboard" target="_blank">https://github.com/mp-se/ha-dashboard</a>
    </p>

    <p class="h4 mt-4">Disclaimer</p>

    <p class="fw-normal">
      THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
      INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
      PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
      ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
      ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
    </p>
  </div>
</template>

<script setup lang="ts">
// No component logic needed for About view
</script>

<style scoped>
.alert {
  border-radius: 0.25rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.alert-info {
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  color: #004085;
}

code {
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}
</style>
