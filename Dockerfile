FROM node:24-bookworm-slim AS frontend-build
WORKDIR /src/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

COPY backend/CallCalendar.Api.csproj backend/
RUN dotnet restore backend/CallCalendar.Api.csproj

COPY backend backend/
RUN dotnet publish backend/CallCalendar.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /src/frontend/dist ./wwwroot

EXPOSE 8080

ENTRYPOINT ["dotnet", "CallCalendar.Api.dll"]
