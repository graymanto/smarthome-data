FROM grafana/grafana:5.0.4
ADD ./provisioning /etc/grafana2/provisioning
ADD ./config.ini /etc/grafana/grafana.ini
ADD ./dashboards /var/lib/grafana/dashboards
ARG SHDC_GFUSER
ARG SHDC_GFPASSWORD
RUN sed -i 's/USERNAME/'"$SHDC_GFUSER"'/g;s/PASSWORD/'"$SHDC_GFPASSWORD"'/g' /etc/grafana2/provisioning/datasources/all.yml
