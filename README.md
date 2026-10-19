##NAVATHON

Repositorio del proyecto Navathon 3

#Tema

Nodo volcánico y calidad ambiental

#objetivo

Crear un sistema de medición de datos con sensores y alertas 

#Integrantes 

- Teo Luciano Monzon Diez
- Ivan Luca Olmedo
- Juan Ignacio Tejera
- Ignacio Diaz Diaz
- Nehuen Gonzalez Bunin
- Lucas Lorido
- Tiziano Silva 
- Cesar Palomino
- Francisco Roman Barrera

#Estructura
C:

└───Navathon
    ├───backend
    │   │   program.cs
    │   │   tpnavathon.Api.csproj
    │   │   tpnavathon.sln
    │   │   
    │   ├───.vs
    │   │   │   slnx.sqlite
    │   │   │   
    │   │   └───backend
    │   │       ├───FileContentIndex
    │   │       │       4f17cef6-7616-4696-95f9-9a674c6eb7c9.vsidx
    │   │       │       
    │   │       └───v18
    │   │               DocumentLayout.json
    │   │               
    │   ├───bin
    │   │   └───Debug
    │   │       ├───net10.0
    │   │       │       Microsoft.OpenApi.dll
    │   │       │       MySqlConnector.dll
    │   │       │       Swashbuckle.AspNetCore.Swagger.dll
    │   │       │       Swashbuckle.AspNetCore.SwaggerGen.dll
    │   │       │       Swashbuckle.AspNetCore.SwaggerUI.dll
    │   │       │       tpnavathon.Api.deps.json
    │   │       │       tpnavathon.Api.dll
    │   │       │       tpnavathon.Api.exe
    │   │       │       tpnavathon.Api.pdb
    │   │       │       tpnavathon.Api.runtimeconfig.json
    │   │       │       tpnavathon.Api.staticwebassets.endpoints.json
    │   │       │       
    │   │       └───net8.0
    │   ├───controllers
    │   │       volcanicController.cs
    │   │       
    │   ├───DAO
    │   │       IVolcanicDao.cs
    │   │       volcanicDBDao.cs
    │   │       volcanicMemorDao.cs
    │   │       
    │   ├───data
    │   │       MySqlConnectionFactory.cs
    │   │       
    │   ├───domain
    │   │       GlobalRiskCalculator.cs
    │   │       recordMetadata.cs
    │   │       volcanicData.cs
    │   │       volcanicRecord.cs
    │   │       
    │   ├───obj
    │   │   │   project.assets.json
    │   │   │   project.nuget.cache
    │   │   │   tpnavathon.Api.csproj.nuget.dgspec.json
    │   │   │   tpnavathon.Api.csproj.nuget.g.props
    │   │   │   tpnavathon.Api.csproj.nuget.g.targets
    │   │   │   
    │   │   └───Debug
    │   │       ├───net10.0
    │   │       │   │   .NETCoreApp,Version=v10.0.AssemblyAttributes.cs
    │   │       │   │   apphost.exe
    │   │       │   │   rjsmcshtml.dswa.cache.json
    │   │       │   │   rjsmrazor.dswa.cache.json
    │   │       │   │   staticwebassets.build.endpoints.json
    │   │       │   │   staticwebassets.build.json
    │   │       │   │   staticwebassets.build.json.cache
    │   │       │   │   swae.build.ex.cache
    │   │       │   │   tpnavath.2D766E57.Up2Date
    │   │       │   │   tpnavathon.Api.AssemblyInfo.cs
    │   │       │   │   tpnavathon.Api.AssemblyInfoInputs.cache
    │   │       │   │   tpnavathon.Api.assets.cache
    │   │       │   │   tpnavathon.Api.csproj.AssemblyReference.cache
    │   │       │   │   tpnavathon.Api.csproj.CoreCompileInputs.cache
    │   │       │   │   tpnavathon.Api.csproj.FileListAbsolute.txt
    │   │       │   │   tpnavathon.Api.dll
    │   │       │   │   tpnavathon.Api.GeneratedMSBuildEditorConfig.editorconfig
    │   │       │   │   tpnavathon.Api.genruntimeconfig.cache
    │   │       │   │   tpnavathon.Api.GlobalUsings.g.cs
    │   │       │   │   tpnavathon.Api.MvcApplicationPartsAssemblyInfo.cache
    │   │       │   │   tpnavathon.Api.MvcApplicationPartsAssemblyInfo.cs
    │   │       │   │   tpnavathon.Api.pdb
    │   │       │   │   tpnavathon.Api.sourcelink.json
    │   │       │   │   
    │   │       │   ├───ref
    │   │       │   │       tpnavathon.Api.dll
    │   │       │   │       
    │   │       │   ├───refint
    │   │       │   │       tpnavathon.Api.dll
    │   │       │   │       
    │   │       │   └───staticwebassets
    │   │       └───net8.0
    │   │           │   .NETCoreApp,Version=v8.0.AssemblyAttributes.cs
    │   │           │   tpnavathon.Api.AssemblyInfo.cs
    │   │           │   tpnavathon.Api.AssemblyInfoInputs.cache
    │   │           │   tpnavathon.Api.assets.cache
    │   │           │   tpnavathon.Api.csproj.AssemblyReference.cache
    │   │           │   tpnavathon.Api.GeneratedMSBuildEditorConfig.editorconfig
    │   │           │   tpnavathon.Api.GlobalUsings.g.cs
    │   │           │   
    │   │           ├───ref
    │   │           └───refint
    │   ├───properties
    │   │       launchSettings.json
    │   │       
    │   ├───services
    │   │       IVolcanicService.cs
    │   │       volcanicService.cs
    │   │       
    │   ├───tpnavathon.api
    │   └───tpnavathon.Tests
    ├───docs
    │   │   endpoints.md
    │   │   requerimientos.md
    │   │   
    │   └───diagrama-clases
    └───frontend
        └───web_navathon
                app.js
                config.js
                index.html
                styles.css

