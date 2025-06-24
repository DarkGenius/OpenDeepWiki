FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
ARG TARGETARCH
WORKDIR /src
COPY ["src/KoalaWiki/KoalaWiki.csproj", "src/KoalaWiki/"]
COPY ["KoalaWiki.Domains/KoalaWiki.Domains.csproj", "KoalaWiki.Domains/"]
COPY ["Provider/KoalaWiki.Provider.PostgreSQL/KoalaWiki.Provider.PostgreSQL.csproj", "Provider/KoalaWiki.Provider.PostgreSQL/"]
COPY ["Provider/KoalaWiki.Provider.Sqlite/KoalaWiki.Provider.Sqlite.csproj", "Provider/KoalaWiki.Provider.Sqlite/"]
COPY ["Provider/KoalaWiki.Provider.SqlServer/KoalaWiki.Provider.SqlServer.csproj", "Provider/KoalaWiki.Provider.SqlServer/"]
COPY ["KoalaWiki.Core/KoalaWiki.Core.csproj", "KoalaWiki.Core/"]
COPY ["NuGet.Config", "."]
RUN dotnet restore "src/KoalaWiki/KoalaWiki.csproj" -a $TARGETARCH
COPY . .
WORKDIR "/src/src/KoalaWiki"
RUN dotnet build "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./KoalaWiki.csproj" -c $BUILD_CONFIGURATION -a $TARGETARCH -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KoalaWiki.dll"]

 