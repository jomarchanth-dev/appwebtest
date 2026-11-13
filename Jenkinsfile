pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        cron('H 2 * * 1-5')
    }

    environment {
        HEADLESS = 'true'
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
        }
    }
}
