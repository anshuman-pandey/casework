FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 CASEWORK_PORT=8080
WORKDIR /app
RUN groupadd --gid 10001 casework && useradd --uid 10001 --gid casework --no-create-home casework \
    && mkdir /data && chown casework:casework /data
COPY --chown=10001:10001 casework/ ./casework/
COPY --chown=10001:10001 LICENSE THIRD_PARTY_NOTICES.md ./
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD python3 -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ['CASEWORK_PORT']+'/api/health', timeout=2).read()"
CMD ["python3", "-m", "casework", "--host", "0.0.0.0", "--db", "/data/casework.db"]
