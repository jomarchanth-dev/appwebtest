pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        booleanParam(
            name: 'VISIBLE',
            defaultValue: false,
            description: 'Si está marcado, Chromium se abre con ventana visible en el escritorio del equipo'
        )
    }

    triggers {
        // Consulta GitHub cada 5 minutos y ejecuta solo si hay commits nuevos. ///////
        pollSCM('H/5 * * * *')
        // Ejecución programada de respaldo, de lunes a viernes.
        // Comentario de prueba: confirma que el cambio dispara pollSCM.
        cron('H 2 * * 1-5')
    }

    environment {
        HEADLESS = "${params.VISIBLE ? 'false' : 'true'}"
        WEBAPP_URL = 'http://localhost:3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Instalar Chromium') {
            steps {
                bat 'npx playwright install chromium'
            }
        }

        stage('Pruebas de login') {
            steps {
                bat 'npm test'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Reporte Playwright'
            ])
        }
    }
}
