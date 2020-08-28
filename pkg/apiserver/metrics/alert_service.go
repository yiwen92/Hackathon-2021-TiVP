package metrics

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pingcap/log"
	"go.uber.org/zap"

	"github.com/pingcap-incubator/tidb-dashboard/pkg/apiserver/utils"
)

// @ID metricsListAlertChannels
// @Summary List all alert channels
// @Security JwtAuth
// @Success 200 {array} AlertChannel
// @Failure 401 {object} utils.APIError "Unauthorized failure"
// @Router /metrics/alert_channels/list [get]
func (s *Service) listAlertChannels(c *gin.Context) {
	var resp []AlertChannel
	err := s.params.LocalStore.Order("id ASC").Find(&resp).Error
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// @ID metricsCreateAlertChannel
// @Summary Create a new alert channel
// @Param request body AlertChannel true "Request body"
// @Security JwtAuth
// @Success 200 {object} AlertChannel
// @Failure 401 {object} utils.APIError "Unauthorized failure"
// @Failure 500 {object} utils.APIError
// @Router /metrics/alert_channels/create [put]
func (s *Service) createAlertChannel(c *gin.Context) {
	var req AlertChannel
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.MakeInvalidRequestErrorFromError(c, err)
		return
	}
	req.ID = 0
	req.Normalize()
	if err := s.params.LocalStore.Create(&req).Error; err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, req)
}

// @ID metricsGetAlertChannel
// @Summary Get an alert channel
// @Param id path string true "ID"
// @Security JwtAuth
// @Success 200 {object} AlertChannel
// @Failure 401 {object} utils.APIError "Unauthorized failure"
// @Failure 500 {object} utils.APIError
// @Router /metrics/alert_channels/get/{id} [get]
func (s *Service) getAlertChannel(c *gin.Context) {
	id := c.Param("id")
	var channel AlertChannel
	err := s.params.LocalStore.First(&channel, "id = ?", id).Error
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, channel)
}

// @ID metricsUpdateAlertChannel
// @Summary Update an alert channel
// @Param request body AlertChannel true "Request body"
// @Security JwtAuth
// @Success 200 {object} utils.APIEmptyResponse
// @Failure 401 {object} utils.APIError "Unauthorized failure"
// @Failure 500 {object} utils.APIError
// @Router /metrics/alert_channels/update [post]
func (s *Service) updateAlertChannel(c *gin.Context) {
	var req AlertChannel
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.MakeInvalidRequestErrorFromError(c, err)
		return
	}

	var channel AlertChannel
	err := s.params.LocalStore.First(&channel, "id = ?", req.ID).Error
	if err != nil {
		_ = c.Error(err)
		return
	}

	req.Normalize()
	if err := s.params.LocalStore.Model(&channel).Update(req).Error; err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, utils.APIEmptyResponse{})
}

// @ID metricsDeleteAlertChannel
// @Summary Delete an alert channel
// @Param id path string true "ID"
// @Security JwtAuth
// @Success 200 {object} utils.APIEmptyResponse
// @Failure 401 {object} utils.APIError "Unauthorized failure"
// @Failure 500 {object} utils.APIError
// @Router /metrics/alert_channels/delete/{id} [delete]
func (s *Service) deleteAlertChannel(c *gin.Context) {
	id := c.Param("id")
	err := s.params.LocalStore.Where("id = ?", id).Delete(&AlertChannel{}).Error
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, utils.APIEmptyResponse{})
}

// @ID metricsTriggerAlertWebhook
// @Summary Trigger as a web hook
// @Param request body object true "Request body"
// @Success 200 {object} utils.APIEmptyResponse
// @Router /metrics/alert_webhook [post]
func (s *Service) alertManagerWebHook(c *gin.Context) {
	if c.GetHeader("Via") == "tidb-dashboard" {
		log.Warn("Received AlertManager Webhook from another TiDB Dashboard instance, dropped")
		c.JSON(http.StatusOK, utils.APIEmptyResponse{})
		return
	}

	var alertData PrometheusPostContent
	if err := c.ShouldBindJSON(&alertData); err != nil {
		utils.MakeInvalidRequestErrorFromError(c, err)
		return
	}
	log.Info("Received AlertManager Webhook", zap.Any("data", &alertData))

	var channels []AlertChannel
	err := s.params.LocalStore.Order("id ASC").Find(&channels).Error
	if err != nil {
		_ = c.Error(err)
		return
	}

	for _, alert := range alertData.Alerts {
		a2 := alert
		for _, channel := range channels {
			go func(alert *PrometheusPostAlert, ch AlertChannel) {
				if err := ch.HandleAlert(alert); err != nil {
					log.Warn("Failed to trigger alert channel",
						zap.String("name", ch.Name),
						zap.String("type", string(ch.Type)),
						zap.Error(err))
				}
			}(&a2, channel)
		}
	}

	c.JSON(http.StatusOK, utils.APIEmptyResponse{})
}
