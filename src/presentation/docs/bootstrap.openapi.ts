/**
 * @openapi
 * /:
 *   get:
 *     tags: [Bootstrap]
 *     summary: Application information
 *     description: Returns API name, version, and running status.
 *     responses:
 *       200:
 *         description: Application is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServiceIdentity'
 *                 meta:
 *                   type: object
 *                 error:
 *                   type: 'null'
 *
 * @openapi
 * /health:
 *   get:
 *     tags: [Bootstrap]
 *     summary: Health check
 *     description: Returns health status. HTTP 503 when database is unavailable.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Service is unhealthy
 */
export {};
