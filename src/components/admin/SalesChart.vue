<script setup>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Registramos los componentes de Chart.js que vamos a utilizar
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// El componente recibe los datos del gráfico como una "prop"
const props = defineProps({
  chartData: {
    type: Object,
    required: true
  }
})

// Opciones de configuración para el gráfico
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // Ocultamos la leyenda para un look más limpio
    },
    title: {
      display: true,
      text: 'Ingresos por Día',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Formatear el eje Y para que muestre el símbolo de dólar
        callback: function (value) {
          return '$' + value;
        }
      }
    }
  }
}
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
